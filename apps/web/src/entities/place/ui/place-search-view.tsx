'use client';

import * as React from 'react';

import { type Result } from '@/shared/api';
import { SearchField } from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { Skeleton } from '@/shared/ui/skeleton';
import { TopAppBar } from '@/shared/ui/top-app-bar';

import type { DepartureDraft } from '../model/departure-draft';
import { toPlaceLabel } from '../model/to-place-label';
import { usePlaceSearch } from '../model/use-place-search';

const SEARCH_IDLE = '서울·경기 내 출발지를 검색해주세요';
const SEARCH_EMPTY = '에 대한 검색 결과가 없어요';
const SEARCH_ERROR = '검색 결과를 불러오지 못했어요';

export interface PlaceSearchViewProps {
  /** Access Token이 없는 게스트 검색에 사용하는 모임 초대 코드. */
  inviteCode?: string;
  /** 장소를 고르면 호출된다. 호출부가 draft 반영과 복귀를 담당한다. */
  onSelect: (place: DepartureDraft) => void;
  /** 선택 없이 뒤로가기. */
  onBack: () => void;
}

export function PlaceSearchView({
  inviteCode,
  onSelect,
  onBack,
}: PlaceSearchViewProps): React.JSX.Element {
  const [inputValue, setInputValue] = React.useState('');
  const search = usePlaceSearch(inputValue, inviteCode);

  const isShowingPreviousResults = search.isDebouncing || search.query.isPlaceholderData;

  const resultCountMessage =
    search.query.isSuccess && !isShowingPreviousResults
      ? `${search.results.length}개의 검색 결과가 있습니다.`
      : '';

  const selectPlace = (place: Result) => {
    onSelect({
      name: toPlaceLabel(place),
      address: place.address ?? '',
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  return (
    <div
      className="flex h-dvh flex-col"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) onBack();
      }}
    >
      <TopAppBar
        className="shrink-0"
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" onClick={onBack} />}
      />

      <div className="relative flex min-h-0 flex-1 flex-col gap-8 px-5 pb-10">
        <form
          role="search"
          className="sticky top-0 h-fit w-full"
          onSubmit={(event) => event.preventDefault()}
        >
          <SearchField
            aria-label="출발지 검색"
            autoFocus
            placeholder="서울·경기 내 출발지를 검색해주세요"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onClear={() => setInputValue('')}
          />
          {(search.isDebouncing || search.query.isFetching) && (
            <span className="sr-only" role="status">
              검색 중...
            </span>
          )}
        </form>

        <div className="w-full flex-1 overflow-y-auto" aria-busy={search.query.isFetching}>
          {search.isIdle && <SearchMessage>{SEARCH_IDLE}</SearchMessage>}

          {!search.isIdle && search.query.isLoading && <SearchResultSkeleton />}

          {!search.isIdle && search.query.isError && (
            <SearchError onRetry={() => void search.query.refetch()} />
          )}

          {!search.isIdle &&
            !search.query.isLoading &&
            !search.query.isError &&
            search.results.length === 0 && (
              <SearchMessage>
                ‘{search.searchQuery}’{SEARCH_EMPTY}
              </SearchMessage>
            )}

          {!search.isIdle && search.results.length > 0 && (
            <SearchedPlaceList
              places={search.results}
              onSelect={selectPlace}
              isStale={isShowingPreviousResults}
            />
          )}

          <p className="sr-only" aria-live="polite">
            {resultCountMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SearchedPlaceListProps {
  places: Result[];
  onSelect: (place: Result) => void;
  isStale: boolean;
}

function SearchedPlaceList({ places, onSelect, isStale }: SearchedPlaceListProps) {
  return (
    <section
      aria-label="검색 결과"
      className={isStale ? 'pointer-events-none opacity-50 transition-opacity' : undefined}
    >
      <ul className="flex flex-col">
        {places.map((place) => {
          const label = toPlaceLabel(place);

          return (
            <li key={`${place.address}-${label}`}>
              <button
                type="button"
                disabled={isStale}
                onClick={() => onSelect(place)}
                className="group flex w-full items-center px-6 py-3 text-left outline-none hover:bg-accessible-50 focus-visible:ring-accessible-300 disabled:cursor-wait"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="group-[]:focus-visible:text-primary truncate text-semibold-14 text-neutral-800 group-hover:text-primary">
                    {label}
                  </span>
                  <span className="truncate text-semibold-14 text-neutral-400">
                    {place.address}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SearchMessage({ children }: React.PropsWithChildren) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-12 bg-neutral-10 py-10">
      <p className="text-medium-14 text-neutral-500">{children}</p>
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div role="status" aria-label="검색 결과를 불러오고 있어요" className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function SearchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-10 py-10">
      <p className="text-medium-14 text-neutral-500">{SEARCH_ERROR}</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
