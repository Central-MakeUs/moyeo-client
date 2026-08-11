import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from './session-store';
import { useSession } from './use-session';

const query = vi.hoisted(() => ({
  current: {
    isPending: false,
    isError: false,
    error: null as unknown,
    data: undefined as unknown,
    refetch: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({ useQuery: () => query.current }));
vi.mock('@/shared/api', () => ({ getMeQueryOptions: () => ({ queryKey: ['me'] }) }));

describe('useSession viewer 조회 실패', () => {
  beforeEach(() => {
    useSessionStore.setState({ accessToken: 'access-token', isRestored: true });
    query.current = {
      isPending: false,
      isError: false,
      error: null,
      data: { id: 1, nickname: '모여', onboardingCompleted: true },
      refetch: vi.fn(),
    };
  });

  it('Offline·timeout 같은 비인가 오류를 무한 loading이 아닌 error로 확정한다', () => {
    query.current = {
      ...query.current,
      isError: true,
      error: Object.assign(new Error('Network Error'), {
        isAxiosError: true,
        code: 'ECONNABORTED',
      }),
    };

    const { result } = renderHook(() => useSession());

    expect(result.current.status).toBe('error');
  });

  it('오류 상태가 제공하는 retry는 viewer 조회를 다시 실행한다', () => {
    query.current = { ...query.current, isError: true, error: new Error('offline') };

    const { result } = renderHook(() => useSession());
    if (result.current.status !== 'error') throw new Error('expected error session');
    result.current.retry();

    expect(query.current.refetch).toHaveBeenCalledOnce();
  });
});
