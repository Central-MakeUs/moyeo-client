'use client';

import { Suspense, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

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
  validateAppleCallback,
  validateKakaoCallback,
  type LoginErrorReason,
} from '@/features/social-login';
import {
  getMeQueryKey,
  REQUEST_TIMEOUT_MS,
  useLoginApple,
  useLoginKakao,
  type AuthResponse,
} from '@/shared/api';
import { AppSplash } from '@/shared/ui/app-splash';

/**
 * 교환 결과를 기다리는 상한.
 *
 * 정상 경로는 axios 타임아웃이 먼저 동작해 `onError`로 실패를 알리는 것이다. 이 watchdog은
 * 요청이 시작조차 되지 않았거나 mutation이 어떤 이유로도 settle되지 않는, axios가 손댈 수
 * 없는 경우를 위한 마지막 안전망이라 그보다 뒤에 동작해야 한다.
 *
 * 이 화면은 성공·실패 모두 이동으로 끝나고 그 사이에는 스플래시만 렌더하므로, 안전망이
 * 없으면 어떤 이유로든 결과가 오지 않을 때 화면이 영원히 고착된다. (#244)
 */
const EXCHANGE_WATCHDOG_MS = REQUEST_TIMEOUT_MS + 5_000;

function OAuthCallbackContent() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  /**
   * 인가 코드는 일회용이다. effect가 다시 돌아 같은 코드를 두 번 교환하면 두 번째는 공급자가
   * 거절하고, 그 실패가 이미 성공한 로그인을 로그인 화면으로 덮어쓴다. 교환은 한 번만 시작한다.
   */
  const hasExchangedRef = useRef(false);

  /** 로그인 후 목적지. `?next=`는 공급자 왕복 중 사라지므로 트랜잭션에 담아둔 값을 쓴다. */
  const nextRef = useRef<string | null>(null);

  /** 결과를 기다리는 안전망 타이머. 결과가 정해지면 즉시 해제한다. */
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current === null) return;

    clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  }, []);

  const failLogin = useCallback(
    (reason: LoginErrorReason) => {
      clearWatchdog();
      clearOAuthTransaction();
      router.replace(buildLoginFailurePath(reason, nextRef.current));
    },
    [clearWatchdog, router]
  );

  /**
   * 교환 결과를 기다리기 시작한다.
   *
   * 제한 시간을 넘기면 실패로 확정한다. 응답이 늦게 도착해 성공하는 편이 낫지 않냐고 볼 수도
   * 있지만, 그때까지 사용자는 멈춘 화면만 본다. 여기서 끊고 다시 시도하게 하는 편이 낫다.
   */
  const startWatchdog = useCallback(() => {
    watchdogRef.current = setTimeout(() => failLogin('timed_out'), EXCHANGE_WATCHDOG_MS);
  }, [failLogin]);

  // 화면을 떠난 뒤 타이머가 살아 있으면 이미 끝난 로그인을 실패로 덮어쓴다.
  useEffect(() => clearWatchdog, [clearWatchdog]);

  const completeLogin = useCallback(
    (auth: AuthResponse) => {
      clearWatchdog();

      const accessToken = toAccessToken(auth);
      if (!accessToken) {
        // 200이지만 토큰이 없는 응답. 세션을 만들 수 없으므로 실패로 처리한다.
        failLogin('exchange_failed');
        return;
      }

      clearOAuthTransaction();

      // 이전 계정 데이터가 화면에 남지 않도록 먼저 비우고 세션을 만든다. (dev 로그인과 같은 순서)
      queryClient.clear();
      setSessionToken(accessToken);

      const viewer = toSessionViewer(auth.user);
      if (viewer) {
        // 로그인 응답에 사용자 정보가 있으면 me 조회 왕복을 없앤다.
        queryClient.setQueryData(getMeQueryKey(), auth.user);
      }

      router.replace(resolvePostLoginPath(auth.user, nextRef.current));
    },
    [clearWatchdog, failLogin, queryClient, router]
  );

  const handleExchangeError = useCallback(() => failLogin('exchange_failed'), [failLogin]);

  const { mutate: exchangeApple } = useLoginApple({
    mutation: { onSuccess: completeLogin, onError: handleExchangeError },
  });
  const { mutate: exchangeKakao } = useLoginKakao({
    mutation: { onSuccess: completeLogin, onError: handleExchangeError },
  });

  useEffect(() => {
    if (hasExchangedRef.current) return;
    hasExchangedRef.current = true;

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

      startWatchdog();
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

      startWatchdog();
      exchangeKakao({
        data: {
          code: result.code,
          redirectTarget: getKakaoRedirectTarget(),
        },
      });
      return;
    }

    failLogin('unsupported_provider');
  }, [params.provider, searchParams, exchangeApple, exchangeKakao, failLogin, startWatchdog]);

  // 성공·실패 모두 리다이렉트로 끝나므로 이 화면은 항상 처리 중 상태다.
  return <AppSplash />;
}

export function OAuthCallbackPage() {
  return (
    <Suspense fallback={<AppSplash />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
