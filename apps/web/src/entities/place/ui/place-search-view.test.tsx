import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlaceSearchView } from './place-search-view';

const { usePlaceSearch } = vi.hoisted(() => ({
  usePlaceSearch: vi.fn(),
}));

vi.mock('../model/use-place-search', () => ({ usePlaceSearch }));

const SEARCH_RESULT = {
  type: 'PLACE',
  displayName: '강남역 2번 출구',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

const mockQuery = (overrides: Record<string, unknown> = {}) => {
  const queryOverrides = (overrides.query as Record<string, unknown> | undefined) ?? {};

  usePlaceSearch.mockReturnValue({
    results: [],
    searchQuery: '',
    isIdle: true,
    isDebouncing: false,
    ...overrides,
    // overrides 뒤에 둬야 query만 부분 덮어쓰기가 된다.
    query: {
      isPlaceholderData: false,
      isFetching: false,
      isLoading: false,
      isSuccess: false,
      isError: false,
      refetch: vi.fn(),
      ...queryOverrides,
    },
  });
};

const renderStep = (props?: Partial<React.ComponentProps<typeof PlaceSearchView>>) =>
  render(<PlaceSearchView onSelect={vi.fn()} onBack={vi.fn()} {...props} />);

beforeEach(() => {
  usePlaceSearch.mockReset();
  mockQuery();
});

describe('PlaceSearchView', () => {
  it('게스트 inviteCode를 장소 검색 훅에 전달한다', () => {
    renderStep({ inviteCode: 'ABC123' });

    expect(usePlaceSearch).toHaveBeenCalledWith('', 'ABC123');
  });

  it('검색 결과 1건을 선택하면 표시명·주소·좌표로 onSelect가 호출된다', async () => {
    const onSelect = vi.fn();
    mockQuery({
      results: [SEARCH_RESULT],
      searchQuery: '강남',
      isIdle: false,
      query: { isSuccess: true },
    });
    renderStep({ onSelect });

    await userEvent.click(screen.getByRole('button', { name: /강남역 2번 출구/ }));

    expect(onSelect).toHaveBeenCalledWith({
      name: '강남역 2번 출구',
      address: '서울 강남구 강남대로 396',
      latitude: 37.4979,
      longitude: 127.0276,
    });
  });

  it('검색어가 비어 있으면 검색 안내를 표시한다', () => {
    renderStep();

    expect(screen.getByText('출발지를 검색해 주세요')).toBeInTheDocument();
    expect(screen.queryByText(/검색 결과가 없어요/)).not.toBeInTheDocument();
  });

  it('최초 검색 중에는 결과 skeleton을 표시한다', () => {
    mockQuery({
      searchQuery: '강남',
      isIdle: false,
      query: { isFetching: true, isLoading: true },
    });
    renderStep();

    expect(screen.getByRole('status', { name: '검색 결과를 불러오고 있어요' })).toBeInTheDocument();
  });

  it('검색 결과가 0건이면 확정된 검색어와 빈 결과 안내를 표시한다', () => {
    mockQuery({
      searchQuery: '없는 장소',
      isIdle: false,
      query: { isSuccess: true },
    });
    renderStep();

    expect(screen.getByText('‘없는 장소’에 대한 검색 결과가 없어요')).toBeInTheDocument();
  });

  it('이전 결과를 표시하는 동안 결과 선택을 막는다', () => {
    mockQuery({
      results: [SEARCH_RESULT],
      searchQuery: '강남',
      isIdle: false,
      isDebouncing: true,
      query: { isSuccess: true },
    });
    renderStep();

    expect(screen.getByRole('button', { name: /강남역 2번 출구/ })).toBeDisabled();
  });

  it('검색 실패 시 다시 시도할 수 있다', async () => {
    const refetch = vi.fn();
    mockQuery({
      searchQuery: '강남',
      isIdle: false,
      query: { isError: true, refetch },
    });
    renderStep();

    expect(screen.getByText('검색 결과를 불러오지 못했어요')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('뒤로가기를 탭하면 onBack이 호출된다', async () => {
    const onBack = vi.fn();
    renderStep({ onBack });

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
