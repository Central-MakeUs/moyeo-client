'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import type { NativeFeature, SocialLoginProvider } from '@repo/types';

import { toSafeNextPath } from '@/entities/session';
import { useLoginKakaoNative } from '@/shared/api';
import { requestSocialLogin, supportsNativeFeature } from '@/shared/model';

import { establishSession } from './establish-session';
import { toExchangeErrorReason, toLoginErrorMessage, type LoginErrorReason } from './login-error';
import { resolvePostLoginPath } from './resolve-post-login-path';
import { startAppleLogin } from './start-apple-login';
import { startKakaoLogin } from './start-kakao-login';

interface UseSocialLoginResult {
  /** 공급자 로그인을 시작한다. 네이티브 지원 여부에 따라 SDK 경로와 웹 경로로 갈린다. */
  startLogin: (provider: SocialLoginProvider) => void;
  /** 네이티브 경로가 진행 중인지. 웹 경로는 페이지를 떠나므로 항상 `false`로 끝난다. */
  isPending: boolean;
  /** 이번 시도의 실패 안내. 성공하거나 사용자가 취소하면 `null`. */
  errorMessage: string | null;
}

/**
 * 소셜 로그인 시작을 네이티브 SDK와 웹 리다이렉트로 갈라 처리한다.
 *
 * **`isNativeContext()`가 아니라 capability로 분기한다.** 웹은 배포 즉시 반영되지만 네이티브는
 * 심사와 사용자 업데이트를 거쳐 늦게 도착하므로, 구버전 바이너리 + 신버전 웹 조합이 상시
 * 존재한다. 그 조합에서 `SOCIAL_LOGIN`을 보내면 응답이 오지 않아 로그인이 멈춘다.
 * `supportsNativeFeature()`는 구버전을 미지원으로 판정하므로 자동으로 웹 경로를 탄다.
 *
 * 네이티브 경로는 리다이렉트 왕복이 없어 콜백 페이지를 거치지 않는다. `state`·트랜잭션 저장도
 * 필요 없고, 토큰 교환부터 화면 이동까지 이 훅에서 끝낸다.
 *
 * @param next 로그인 후 돌아갈 내부 경로
 */
export function useSocialLogin(next?: string | null): UseSocialLoginResult {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 진행 중 재클릭을 막는다.
   *
   * 네이티브 경로는 SDK 왕복 동안 화면에 머물러 있어 버튼을 다시 누를 수 있다. 두 번 누르면
   * SDK 로그인이 중복 실행된다. 상태가 아니라 ref로 두는 것은 같은 tick에 연달아 들어온
   * 클릭까지 막기 위해서다.
   */
  const isPendingRef = useRef(false);

  const { mutateAsync: exchangeKakaoNative } = useLoginKakaoNative();

  const fail = useCallback((reason: LoginErrorReason) => {
    setErrorMessage(toLoginErrorMessage(reason));
  }, []);

  const runNativeLogin = useCallback(
    async (provider: SocialLoginProvider) => {
      const result = await requestSocialLogin(provider);

      // 사용자가 스스로 닫았다. 안내 없이 로그인 화면에 머문다.
      if (result.state === 'cancelled') return;

      if (result.state !== 'success') {
        fail('start_failed');
        return;
      }

      let auth;
      try {
        // 애플은 서버 계약이 달라 #98에서 분기한다. 지금은 카카오만 네이티브 경로를 탄다.
        auth = await exchangeKakaoNative({ data: { accessToken: result.token } });
      } catch (error) {
        fail(toExchangeErrorReason(error));
        return;
      }

      if (!establishSession(auth, queryClient)) {
        // 200이지만 토큰이 없는 응답. 세션을 만들 수 없다.
        fail('exchange_failed');
        return;
      }

      router.replace(resolvePostLoginPath(auth.user, toSafeNextPath(next)));
    },
    [exchangeKakaoNative, fail, next, queryClient, router]
  );

  const startLogin = useCallback(
    (provider: SocialLoginProvider) => {
      if (isPendingRef.current) return;

      isPendingRef.current = true;
      setErrorMessage(null);
      setIsPending(true);

      const feature: NativeFeature = `socialLogin.${provider}`;

      void (async () => {
        try {
          if (await supportsNativeFeature(feature)) {
            await runNativeLogin(provider);
            return;
          }

          // 웹 폴백. 공급자 페이지로 이동하므로 정상 흐름에서는 여기서 반환되지 않는다.
          if (provider === 'kakao') startKakaoLogin(next);
          else startAppleLogin(next);
        } catch {
          // 브리지 타임아웃, 환경변수 누락 등 시작 자체의 실패.
          // 여기서 삼키지 않으면 클릭이 무반응으로 끝난다.
          fail('start_failed');
        } finally {
          isPendingRef.current = false;
          setIsPending(false);
        }
      })();
    },
    [fail, next, runNativeLogin]
  );

  return { startLogin, isPending, errorMessage };
}
