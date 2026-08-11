'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import {
  clearOAuthTransaction,
  getAppleRedirectTarget,
  getKakaoRedirectTarget,
  readOAuthTransaction,
} from '@/entities/auth';
import { setSessionToken, toAccessToken, toSessionViewer } from '@/entities/session';
import {
  buildLoginFailurePath,
  resolvePostLoginPath,
  toLoginErrorMessage,
  validateAppleCallback,
  validateKakaoCallback,
  type LoginErrorReason,
} from '@/features/social-login';
import { getMeQueryKey, useLoginApple, useLoginKakao, type AuthResponse } from '@/shared/api';
import { AppSplash } from '@/shared/ui/app-splash';

/** API timeout보다 긴 최종 안전망. mutation이 어떤 이유로도 settle되지 않으면 사용자를 내보낸다. */
export const OAUTH_EXCHANGE_WATCHDOG_MS = 20_000;
/** 로그인 성공 후 App Router 전환이 끝나지 않을 때 복구 UI를 보여주기까지의 상한. */
export const POST_LOGIN_NAVIGATION_WATCHDOG_MS = 10_000;

type OAuthCallbackState =
  | { status: 'validating' }
  | { status: 'exchanging' }
  | { status: 'navigating'; destination: string }
  | { status: 'failed'; reason: LoginErrorReason; loginPath: string }
  | { status: 'navigation_failed'; destination: string };

function isTimeoutError(error: unknown): boolean {
  return isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
}

function OAuthCallbackContent() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [callbackState, setCallbackState] = useState<OAuthCallbackState>({
    status: 'validating',
  });

  /**
   * 인가 코드는 일회용이다. effect가 다시 돌아 같은 코드를 두 번 교환하면 두 번째는 공급자가
   * 거절하고, 그 실패가 이미 성공한 로그인을 로그인 화면으로 덮어쓴다. 교환은 한 번만 시작한다.
   */
  const hasExchangedRef = useRef(false);
  /** watchdog 이후 늦게 도착한 성공·실패가 이미 확정된 화면 이동을 덮어쓰지 못하게 한다. */
  const hasFinishedRef = useRef(false);

  /** 로그인 후 목적지. `?next=`는 공급자 왕복 중 사라지므로 트랜잭션에 담아둔 값을 쓴다. */
  const nextRef = useRef<string | null>(null);

  const failLogin = useCallback(
    (reason: LoginErrorReason) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      clearOAuthTransaction();
      const loginPath = buildLoginFailurePath(reason, nextRef.current);

      // 오프라인에서는 App Router 이동도 끝나지 않을 수 있으므로 실패 상태를 먼저 화면에 확정한다.
      setCallbackState({ status: 'failed', reason, loginPath });

      // Next가 실패한 client navigation을 hard navigation으로 폴백하면 브라우저의 오프라인
      // 오류 문서로 현재 화면까지 잃을 수 있다. 오프라인에서는 사용자의 명시적 재시도까지 머문다.
      if (navigator.onLine) router.replace(loginPath);
    },
    [router]
  );

  const completeLogin = useCallback(
    (auth: AuthResponse) => {
      if (hasFinishedRef.current) return;

      const accessToken = toAccessToken(auth);
      if (!accessToken) {
        // 200이지만 토큰이 없는 응답. 세션을 만들 수 없으므로 실패로 처리한다.
        failLogin('exchange_failed');
        return;
      }

      hasFinishedRef.current = true;
      clearOAuthTransaction();

      // 이전 계정 데이터가 화면에 남지 않도록 먼저 비우고 세션을 만든다. (dev 로그인과 같은 순서)
      queryClient.clear();
      setSessionToken(accessToken);

      const viewer = toSessionViewer(auth.user);
      if (viewer) {
        // 로그인 응답에 사용자 정보가 있으면 me 조회 왕복을 없앤다.
        queryClient.setQueryData(getMeQueryKey(), auth.user);
      }

      const destination = resolvePostLoginPath(auth.user, nextRef.current);
      if (!navigator.onLine) {
        setCallbackState({ status: 'navigation_failed', destination });
        return;
      }

      setCallbackState({ status: 'navigating', destination });
      router.replace(destination);
    },
    [failLogin, queryClient, router]
  );

  const handleExchangeError = useCallback(
    (error: unknown) => failLogin(isTimeoutError(error) ? 'timed_out' : 'exchange_failed'),
    [failLogin]
  );

  const { mutate: exchangeApple } = useLoginApple({
    mutation: { onSuccess: completeLogin, onError: handleExchangeError },
  });
  const { mutate: exchangeKakao } = useLoginKakao({
    mutation: { onSuccess: completeLogin, onError: handleExchangeError },
  });

  // OAuth Callback 페이지에 들어오고 20초간 응답이 없는 경우 failLogin 호출
  useEffect(() => {
    if (callbackState.status !== 'exchanging') return;

    const watchdog = window.setTimeout(() => failLogin('timed_out'), OAUTH_EXCHANGE_WATCHDOG_MS);
    return () => window.clearTimeout(watchdog);
  }, [callbackState.status, failLogin]);

  // 인증은 끝났지만 RSC 화면 전환이 멈추는 경우를 별도로 확정한다.
  useEffect(() => {
    if (callbackState.status !== 'navigating') return;

    const destination = callbackState.destination;
    const failNavigation = () =>
      setCallbackState((current) =>
        current.status === 'navigating' ? { status: 'navigation_failed', destination } : current
      );
    const watchdog = window.setTimeout(failNavigation, POST_LOGIN_NAVIGATION_WATCHDOG_MS);

    window.addEventListener('offline', failNavigation);
    return () => {
      window.clearTimeout(watchdog);
      window.removeEventListener('offline', failNavigation);
    };
  }, [callbackState]);

  //
  useEffect(() => {
    if (hasExchangedRef.current) return;
    hasExchangedRef.current = true;

    try {
      const transaction = readOAuthTransaction();
      nextRef.current = transaction?.next ?? null;

      const callbackParams = {
        code: searchParams.get('code'),
        state: searchParams.get('state'),
        error: searchParams.get('error'),
      };

      if (params.provider === 'apple') {
        const result = validateAppleCallback(callbackParams, transaction);

        if (result.status === 'error') {
          failLogin(result.reason);
          return;
        }

        setCallbackState({ status: 'exchanging' });
        exchangeApple({
          data: {
            code: result.code,
            nonce: result.nonce,
            redirectTarget: getAppleRedirectTarget(),
          },
        });
        return;
      }

      if (params.provider === 'kakao') {
        const result = validateKakaoCallback(callbackParams, transaction);
        if (result.status === 'error') {
          failLogin(result.reason);
          return;
        }

        setCallbackState({ status: 'exchanging' });
        exchangeKakao({
          data: {
            code: result.code,
            redirectTarget: getKakaoRedirectTarget(),
          },
        });
        return;
      }

      failLogin('unsupported_provider');
    } catch {
      // 잘못된 배포 환경변수나 저장소 접근 같은 동기 예외도 스플래시에 고착시키지 않는다.
      failLogin('exchange_failed');
    }
  }, [params.provider, searchParams, exchangeApple, exchangeKakao, failLogin]);

  if (callbackState.status === 'failed') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-0 px-6">
        <p role="alert" className="text-center text-medium-14 text-neutral-500">
          {toLoginErrorMessage(callbackState.reason)}
        </p>
        <button
          type="button"
          onClick={() => router.replace(callbackState.loginPath)}
          className="rounded-8 bg-primary px-4 py-2 text-semibold-14 text-neutral-0"
        >
          로그인으로 돌아가기
        </button>
      </main>
    );
  }

  if (callbackState.status === 'navigation_failed') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-0 px-6">
        <p role="alert" className="text-center text-medium-14 text-neutral-500">
          로그인은 완료됐지만 화면을 불러오지 못했어요.
          <br />
          네트워크 연결을 확인해 주세요.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!navigator.onLine) return;
            setCallbackState({
              status: 'navigating',
              destination: callbackState.destination,
            });
            router.replace(callbackState.destination);
          }}
          className="rounded-8 bg-primary px-4 py-2 text-semibold-14 text-neutral-0"
        >
          화면 다시 불러오기
        </button>
      </main>
    );
  }

  // validating·exchanging·navigating은 검증/요청/화면 이동이 진행 중인 유한 상태다.
  return <AppSplash />;
}

export function OAuthCallbackPage() {
  return (
    <Suspense fallback={<AppSplash />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
