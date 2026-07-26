import { getToken, useMe } from '@/shared/api';

import type { SessionState } from './session-routing';

// 저장된 토큰 + useMe로 현재 세션 상태를 판정한다 (null = 판정 중).
export function useSessionState(): SessionState | null {
  const hasToken = getToken() !== null;
  const { data, isError, isPending } = useMe({ query: { enabled: hasToken, retry: false } });

  if (!hasToken) {
    return { status: 'no-token' };
  }
  if (isError) {
    return { status: 'unauthorized' };
  }
  if (isPending || !data) {
    return null;
  }
  return { status: 'authenticated', user: data };
}
