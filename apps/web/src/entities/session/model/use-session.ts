'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { getMeQueryOptions } from '@/shared/api';

import { type SessionState, toSessionViewer } from './session';
import { useSessionStore } from './session-store';

const VIEWER_STALE_TIME_MS = 5 * 60 * 1000; //5분

function isUnauthorized(error: unknown): boolean {
  return (error as AxiosError | null)?.response?.status === 401;
}

/**
 * 세션 상태를 한 곳에서 계산한다.
 * 토큰은 저장소가 정본이고, 사용자 정보는 `GET /api/auth/me`에서 파생한다.
 */
export function useSession(): SessionState {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isRestored = useSessionStore((state) => state.isRestored);

  const viewerQuery = useQuery({
    ...getMeQueryOptions(),
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: VIEWER_STALE_TIME_MS,
  });

  if (!isRestored) return { status: 'loading' };
  if (!accessToken) return { status: 'anonymous' };
  if (viewerQuery.isPending) return { status: 'loading' };

  if (viewerQuery.isError) {
    // 401이면 response interceptor가 이미 세션을 비웠으므로 다음 렌더에서 anonymous로 확정된다.
    if (isUnauthorized(viewerQuery.error)) return { status: 'anonymous' };

    // 네트워크 오류는 로그아웃이 아니므로 무한 스플래시 대신 재시도 함수를 제공한다.
    return { status: 'error', retry: () => void viewerQuery.refetch() };
  }

  const viewer = toSessionViewer(viewerQuery.data);
  if (!viewer) return { status: 'error', retry: () => void viewerQuery.refetch() };

  return { status: 'authenticated', accessToken, viewer };
}
