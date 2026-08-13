'use client';

import type { QueryClient } from '@tanstack/react-query';

import { setSessionToken, toAccessToken, toSessionViewer } from '@/entities/session';
import { getMeQueryKey, type AuthResponse } from '@/shared/api';

/**
 * 로그인 응답으로 클라이언트 세션을 만든다.
 *
 * 웹 OAuth 콜백(리다이렉트 왕복)과 네이티브 SDK 로그인(브리지)은 토큰을 얻는 경로만 다르고
 * 그 이후는 같다. 이 함수가 그 공통 구간이다.
 *
 * 화면 이동은 하지 않는다. 콜백 페이지는 watchdog이 붙은 상태 머신으로, 네이티브 경로는
 * 곧바로 `router.replace`로 서로 다르게 처리하기 때문이다.
 *
 * @param auth 로그인 응답
 * @param queryClient 이전 계정 데이터를 비우고 me 캐시를 채울 클라이언트
 * @returns 세션을 만들었으면 `true`. 200이지만 토큰이 없어 세션을 만들 수 없으면 `false`.
 */
export function establishSession(auth: AuthResponse, queryClient: QueryClient): boolean {
  const accessToken = toAccessToken(auth);
  if (!accessToken) return false;

  // 이전 계정 데이터가 화면에 남지 않도록 먼저 비우고 세션을 만든다. (dev 로그인과 같은 순서)
  queryClient.clear();
  setSessionToken(accessToken);

  const viewer = toSessionViewer(auth.user);
  if (viewer) {
    // 로그인 응답에 사용자 정보가 있으면 me 조회 왕복을 없앤다.
    queryClient.setQueryData(getMeQueryKey(), auth.user);
  }

  return true;
}
