'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { search } from '@/shared/api';

import { useDebouncedValue } from '@/shared/lib/use-debounced-value';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 1;
const SEARCH_STALE_TIME = 2 * 60 * 1000;
const SEARCH_GC_TIME = 10 * 60 * 1000;

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function usePlaceSearch(inputValue: string, inviteCode?: string) {
  const normalizedInput = normalizeSearchQuery(inputValue);
  const debouncedQuery = useDebouncedValue(normalizedInput, SEARCH_DEBOUNCE_MS);
  const enabled = debouncedQuery.length >= SEARCH_MIN_LENGTH;

  const query = useQuery({
    queryKey: [
      'departure-place-search',
      { keyword: debouncedQuery, ...(inviteCode === undefined ? {} : { inviteCode }) },
    ],
    queryFn: ({ signal }) =>
      search(
        { keyword: debouncedQuery },
        inviteCode === undefined ? undefined : { inviteCode },
        undefined,
        signal
      ),
    enabled,
    staleTime: SEARCH_STALE_TIME,
    gcTime: SEARCH_GC_TIME,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status) {
        return error.response.status >= 500 && failureCount < 1;
      }

      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    query,
    results: query.data?.results ?? [],
    searchQuery: debouncedQuery,
    isIdle: normalizedInput.length < SEARCH_MIN_LENGTH,
    isDebouncing: normalizedInput !== debouncedQuery,
  };
}
