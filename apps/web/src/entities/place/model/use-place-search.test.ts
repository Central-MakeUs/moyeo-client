import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const { search, useQuery, useDebouncedValue } = vi.hoisted(() => ({
  search: vi.fn(),
  useQuery: vi.fn(),
  useDebouncedValue: vi.fn((value: string) => value),
}));

vi.mock('@/shared/api', () => ({ search }));
vi.mock('@tanstack/react-query', () => ({
  keepPreviousData: vi.fn(),
  useQuery,
}));
vi.mock('./use-debounced-value', () => ({ useDebouncedValue }));

import { normalizeSearchQuery, usePlaceSearch } from './use-place-search';

describe('normalizeSearchQuery', () => {
  it('앞뒤 공백을 제거하고 연속 공백을 하나로 합친다', () => {
    expect(normalizeSearchQuery('  강남   역  ')).toBe('강남 역');
  });
});

describe('usePlaceSearch', () => {
  beforeEach(() => {
    search.mockReset();
    useQuery.mockReset();
    useDebouncedValue.mockClear();
    useQuery.mockReturnValue({
      data: undefined,
      isPlaceholderData: false,
    });
  });

  it('빈 검색은 비활성화한다', () => {
    renderHook(() => usePlaceSearch('   '));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['departure-place-search', { keyword: '' }],
        enabled: false,
      })
    );
  });

  it('한 글자 검색도 활성화한다', () => {
    renderHook(() => usePlaceSearch(' 역 '));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['departure-place-search', { keyword: '역' }],
        enabled: true,
      })
    );
  });

  it('검색을 활성화하고 AbortSignal을 API 함수에 전달한다', async () => {
    const signal = new AbortController().signal;
    search.mockResolvedValue({ results: [] });

    renderHook(() => usePlaceSearch(' 강남 '));

    const options = useQuery.mock.calls[0]?.[0];
    expect(options).toEqual(
      expect.objectContaining({
        queryKey: ['departure-place-search', { keyword: '강남' }],
        enabled: true,
        staleTime: 120_000,
        gcTime: 600_000,
        refetchOnWindowFocus: false,
      })
    );

    await options.queryFn({ signal });
    expect(search).toHaveBeenCalledWith({ keyword: '강남' }, undefined, undefined, signal);
  });

  it('게스트 검색이면 inviteCode를 API 검색 파라미터로 전달한다', async () => {
    const signal = new AbortController().signal;
    search.mockResolvedValue({ results: [] });

    renderHook(() => usePlaceSearch('강남', 'ABC123'));

    const options = useQuery.mock.calls[0]?.[0];
    expect(options.queryKey).toEqual([
      'departure-place-search',
      { keyword: '강남', inviteCode: 'ABC123' },
    ]);

    await options.queryFn({ signal });
    expect(search).toHaveBeenCalledWith(
      { keyword: '강남' },
      { inviteCode: 'ABC123' },
      undefined,
      signal
    );
  });
});
