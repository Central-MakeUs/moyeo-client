import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { useGetServerTime } = vi.hoisted(() => ({ useGetServerTime: vi.fn() }));
vi.mock('@/shared/api', () => ({ useGetServerTime }));

import { useServerToday } from './use-server-today';

const refetch = vi.fn();

/** useGetServerTime의 반환을 상황별로 흉내낸다. */
const mockQuery = (value: { data?: { serverTime?: string }; status: string }) => {
  useGetServerTime.mockReturnValue({ ...value, refetch });
};

describe('useServerToday', () => {
  beforeEach(() => {
    useGetServerTime.mockReset();
    refetch.mockReset();
  });

  it("should return serverToday '2026-07-26' and status 'success' when query resolves with serverTime '2026-07-25T15:30:00Z'", () => {
    mockQuery({ data: { serverTime: '2026-07-25T15:30:00Z' }, status: 'success' });

    const { result } = renderHook(() => useServerToday());

    expect(result.current.serverToday).toBe('2026-07-26');
    expect(result.current.status).toBe('success');
  });

  it("should return status 'pending' and serverToday null while the query is pending", () => {
    mockQuery({ data: undefined, status: 'pending' });

    const { result } = renderHook(() => useServerToday());

    expect(result.current.status).toBe('pending');
    expect(result.current.serverToday).toBeNull();
  });

  it("should return status 'error' and serverToday null when the query fails", () => {
    mockQuery({ data: undefined, status: 'error' });

    const { result } = renderHook(() => useServerToday());

    expect(result.current.status).toBe('error');
    expect(result.current.serverToday).toBeNull();
  });

  it("should return status 'error' when the query succeeds but serverTime is missing", () => {
    mockQuery({ data: {}, status: 'success' });

    const { result } = renderHook(() => useServerToday());

    expect(result.current.status).toBe('error');
    expect(result.current.serverToday).toBeNull();
  });

  it('should call the query refetch when refetch is invoked', () => {
    mockQuery({ data: undefined, status: 'error' });

    const { result } = renderHook(() => useServerToday());
    result.current.refetch();

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
