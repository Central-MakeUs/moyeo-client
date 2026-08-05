'use client';

import { useCallback, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import {
  clearSession,
  resolveNextPath,
  setSessionToken,
  toAccessToken,
  toSessionViewer,
  NEXT_PARAM,
} from '@/entities/session';
import { getMeQueryKey, useIssueTokens } from '@/shared/api';

/** 서버가 한 번에 발급하는 테스트 계정 2개. */
export type DevAccount = 'userOne' | 'userTwo';

const LOGIN_PATH = '/login';
const ONBOARDING_PATH = '/nickname';
const devAccessToken = process.env.NEXT_PUBLIC_DEV_ACCESS_TOKEN?.trim() ?? '';

export function useDevAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const issueTokens = useIssueTokens();
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (account: DevAccount) => {
      setError(null);

      try {
        const tokens = await issueTokens.mutateAsync();
        const auth = tokens[account];
        const accessToken = toAccessToken(auth);

        if (!accessToken) {
          setError(`${account} 토큰이 응답에 없습니다.`);
          return;
        }

        // 이전 계정 데이터가 화면에 남지 않도록 먼저 비우고 세션 정보를 저장한다.
        queryClient.clear();
        setSessionToken(accessToken);

        const viewer = toSessionViewer(auth?.user);
        if (viewer) {
          // 로그인 응답에 사용자 정보가 있으면 me 조회 왕복을 없앤다.
          queryClient.setQueryData(getMeQueryKey(), auth?.user);
        }

        if (viewer && !viewer.onboardingCompleted) {
          router.replace(ONBOARDING_PATH);
          return;
        }

        if (pathname === LOGIN_PATH) {
          const next = new URLSearchParams(window.location.search).get(NEXT_PARAM);
          router.replace(resolveNextPath(next));
        }
      } catch {
        setError('토큰 발급에 실패했습니다. 서버 프로필이 local/dev 인지 확인하세요.');
      }
    },
    [issueTokens, pathname, queryClient, router]
  );

  const signOut = useCallback(() => {
    setError(null);
    clearSession();
    queryClient.clear();
    router.replace(LOGIN_PATH);
  }, [queryClient, router]);

  const signInWithAccessToken = useCallback(() => {
    setError(null);

    if (!devAccessToken) {
      setError('NEXT_PUBLIC_DEV_ACCESS_TOKEN이 설정되지 않았습니다.');
      return;
    }

    queryClient.clear();
    setSessionToken(devAccessToken);

    if (pathname === LOGIN_PATH) {
      const next = new URLSearchParams(window.location.search).get(NEXT_PARAM);
      router.replace(resolveNextPath(next));
    }
  }, [pathname, queryClient, router]);

  return {
    signIn,
    signInWithAccessToken,
    signOut,
    isPending: issueTokens.isPending,
    hasDevAccessToken: devAccessToken.length > 0,
    error,
  };
}
