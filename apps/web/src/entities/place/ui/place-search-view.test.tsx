import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { runBackHandlers } from '@/shared/model';
import { OverlayProvider } from '@/shared/ui/overlay';

import { PlaceSearchView } from './place-search-view';

const { usePlaceSearch } = vi.hoisted(() => ({
  usePlaceSearch: vi.fn(),
}));

vi.mock('../model/use-place-search', () => ({ usePlaceSearch }));

// 위치 확인 화면의 좌표·주소 획득은 목으로 고정한다. jsdom에는 Geolocation도 카카오 SDK도
// 없어서, 목이 없으면 진입 즉시 실패 상태가 되어 확인 CTA까지 도달할 수 없다.
// 확정 상태를 만드는 것은 목이지만, picker를 여닫는 URL 전환은 실제 usePickerRoute가 돈다.
const { useCurrentLocation } = vi.hoisted(() => ({ useCurrentLocation: vi.fn() }));
const { usePinAddress } = vi.hoisted(() => ({ usePinAddress: vi.fn() }));

vi.mock('../model/use-current-location', () => ({ useCurrentLocation }));
vi.mock('../model/use-pin-address', () => ({ usePinAddress }));

vi.mock('@/shared/ui/map-location-picker', () => ({
  MapLocationPicker: () => <div aria-label="지도" />,
}));

// picker 열림 상태는 URL이 소유한다. usePickerRoute는 목킹하지 않고 실제로 돌린다 —
// 목으로 갈아끼우면 "버튼 → URL → 렌더" 배선이 검증에서 빠진다.
const { push, back, replace, navigation } = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  navigation: {
    pathname: '/meetings/new/departure/search',
    searchParams: new URLSearchParams(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back, replace }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
}));

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
  render(<PlaceSearchView onSelect={vi.fn()} onBack={vi.fn()} {...props} />, {
    wrapper: OverlayProvider,
  });

/** 위치 확인 화면의 핀 좌표. 기기의 현재 좌표와 구분하려고 다른 값을 쓴다. */
const PIN = { latitude: 37.57, longitude: 126.98 };

const CURRENT_COORDS = { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 };

const SEOUL_CITY_HALL = {
  details: {
    roadAddress: '서울특별시 중구 세종대로 110',
    jibunAddress: '서울 중구 태평로1가 31',
    isSupportedRegion: true,
  },
  coords: PIN,
};

/** `null` 이면 좌표 요청 중이다. */
const mockCurrentLocation = (result: unknown = null) => {
  useCurrentLocation.mockReturnValue({ result, retry: vi.fn() });
};

/** 지정하지 않은 필드는 "아직 아무것도 조회하지 않은" 기본값이다. */
const mockGeocode = (state: Record<string, unknown> = {}) => {
  usePinAddress.mockReturnValue({
    state: { lastResult: null, requestStatus: 'idle', canConfirmLocation: false, ...state },
    requestAddress: vi.fn(),
    startMoving: vi.fn(),
    retry: vi.fn(),
  });
};

/** 지도가 뜨고 현재 핀의 주소까지 확정된 상태 — 확인 CTA가 활성인 조건이다. */
const mockConfirmableAddress = () => {
  mockCurrentLocation({ state: 'success', coords: CURRENT_COORDS });
  mockGeocode({
    lastResult: SEOUL_CITY_HALL,
    requestStatus: 'resolved',
    canConfirmLocation: true,
  });
};

beforeEach(() => {
  usePlaceSearch.mockReset();
  mockQuery();
  mockCurrentLocation();
  mockGeocode();
  push.mockClear();
  back.mockClear();
  replace.mockClear();
  navigation.pathname = '/meetings/new/departure/search';
  navigation.searchParams = new URLSearchParams();
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

  it('검색어가 비어 있으면 출발지 빠른 선택을 표시한다', () => {
    renderStep();

    // idle 안내 문구는 DepartureQuickSelect로 대체됐다 (INV-03-A).
    expect(screen.getByRole('button', { name: /현재 위치로 찾기/ })).toBeInTheDocument();
    expect(screen.getByText('저장된 출발지')).toBeInTheDocument();
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

  describe('현재 위치로 찾기', () => {
    const openedByQuery = () => {
      navigation.searchParams = new URLSearchParams('picker=current');
    };

    const getPicker = () => screen.getByRole('dialog', { name: '현재 위치 확인' });

    it('"현재 위치로 찾기"를 클릭하면 router.push가 ?picker=current로 1회 호출된다', async () => {
      renderStep();

      await userEvent.click(screen.getByRole('button', { name: /현재 위치로 찾기/ }));

      expect(push).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith('/meetings/new/departure/search?picker=current');
    });

    it('URL이 ?picker=current면 위치 확인 화면이 렌더되고 검색 입력 필드가 그대로 남아 있다', () => {
      openedByQuery();

      renderStep();

      expect(getPicker()).toBeInTheDocument();
      // 검색 본문을 언마운트하지 않는다 — 입력값이 날아가고 복귀 시 깜빡인다 (R3).
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    // URL을 직접 세팅한 것은 §4-5의 "직접 진입"이라 되감을 항목이 없다 — replace로 닫는다.
    // push로 열고 back으로 닫는 경로는 use-picker-route.test.ts가 잡는다.
    it('?picker=current로 직접 진입한 상태에서 위치 확인 화면의 뒤로가기를 클릭하면 router.replace로 닫히고 onSelect는 호출되지 않는다', async () => {
      openedByQuery();
      const onSelect = vi.fn();
      renderStep({ onSelect });

      await userEvent.click(within(getPicker()).getByRole('button', { name: '뒤로가기' }));

      expect(replace).toHaveBeenCalledTimes(1);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('?picker=current에서 runBackHandlers()를 실행하면 picker의 닫기 경로를 타고 onBack은 호출되지 않는다', () => {
      openedByQuery();
      const onBack = vi.fn();
      renderStep({ onBack });

      expect(runBackHandlers()).toBe(true);
      expect(replace).toHaveBeenCalledTimes(1);
      expect(onBack).not.toHaveBeenCalled();
    });

    describe('확인 CTA로 출발지 확정', () => {
      const SEARCH_URL = '/meetings/new/departure/search';

      /** props를 고정한 채 URL 변화만 반영하려면 같은 element로 rerender해야 한다. */
      const renderView = (props: Partial<React.ComponentProps<typeof PlaceSearchView>>) => {
        const merged = { onSelect: vi.fn(), onBack: vi.fn(), ...props };
        const view = render(<PlaceSearchView {...merged} />, { wrapper: OverlayProvider });

        return { rerender: () => view.rerender(<PlaceSearchView {...merged} />) };
      };

      it('위치 확인 화면을 앱 셸 너비의 overlay root 안에 렌더한다', () => {
        openedByQuery();
        renderStep();

        const overlayRoot = document.querySelector('[data-slot="overlay-root"]');

        expect(overlayRoot).toContainElement(getPicker());
      });

      /** back/replace는 목이라 URL이 저절로 바뀌지 않는다. 닫힘 반영을 수동으로 만든다. */
      const closedByUrl = () => {
        navigation.searchParams = new URLSearchParams();
      };

      const clickCta = () =>
        userEvent.click(within(getPicker()).getByRole('button', { name: '이 위치로 주소 등록' }));

      it('현재 위치로 찾기로 연 뒤 확인 CTA를 클릭하면 router.back이 1회 호출되고 그 시점에는 onSelect가 호출되지 않는다', async () => {
        mockConfirmableAddress();
        const onSelect = vi.fn();
        const { rerender } = renderView({ onSelect });

        await userEvent.click(screen.getByRole('button', { name: /현재 위치로 찾기/ }));
        openedByQuery();
        rerender();

        await clickCta();

        // push로 연 항목을 되감는다. replace가 아니다 (spec-fixed.md §4-4).
        expect(back).toHaveBeenCalledTimes(1);
        expect(replace).not.toHaveBeenCalled();
        // 같은 tick에 선택까지 태우지 않는다.
        expect(onSelect).not.toHaveBeenCalled();
      });

      it('확인 CTA 클릭 후 picker 쿼리가 사라지면 onSelect가 핀 좌표 draft로 정확히 1회 호출된다', async () => {
        mockConfirmableAddress();
        const onSelect = vi.fn();
        const { rerender } = renderView({ onSelect });

        await userEvent.click(screen.getByRole('button', { name: /현재 위치로 찾기/ }));
        openedByQuery();
        rerender();
        await clickCta();

        closedByUrl();
        rerender();

        expect(onSelect).toHaveBeenCalledTimes(1);
        // 좌표는 기기의 현재 좌표가 아니라 핀 좌표다 (§6-2).
        expect(onSelect).toHaveBeenCalledWith({
          name: '서울특별시 중구 세종대로 110',
          address: '서울특별시 중구 세종대로 110',
          latitude: 37.57,
          longitude: 126.98,
        });
      });

      it('onSelect가 호출된 뒤 추가로 rerender해도 onSelect 호출 횟수는 1회다', async () => {
        mockConfirmableAddress();
        const onSelect = vi.fn();
        const { rerender } = renderView({ onSelect });

        await userEvent.click(screen.getByRole('button', { name: /현재 위치로 찾기/ }));
        openedByQuery();
        rerender();
        await clickCta();

        closedByUrl();
        rerender();
        rerender();
        rerender();

        expect(onSelect).toHaveBeenCalledTimes(1);
      });

      it('?picker=current로 직접 진입한 상태에서 확인 CTA를 클릭하면 router.replace로 닫힌 뒤 onSelect가 1회 호출된다', async () => {
        openedByQuery();
        mockConfirmableAddress();
        const onSelect = vi.fn();
        const { rerender } = renderView({ onSelect });

        await clickCta();

        // 되감을 항목이 없는 진입이라 back이 아니라 replace다 (§4-5).
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace).toHaveBeenCalledWith(SEARCH_URL);
        expect(back).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();

        closedByUrl();
        rerender();

        expect(onSelect).toHaveBeenCalledTimes(1);
      });

      it('지도 이동 중에 확인 CTA를 클릭하면 router.back·router.replace·onSelect가 모두 호출되지 않는다', async () => {
        openedByQuery();
        mockCurrentLocation({ state: 'success', coords: CURRENT_COORDS });
        // 이동 중에는 직전 주소가 남아 있어도 현재 핀의 주소가 아니다.
        mockGeocode({
          lastResult: SEOUL_CITY_HALL,
          requestStatus: 'resolved',
          canConfirmLocation: false,
        });
        const onSelect = vi.fn();
        renderView({ onSelect });

        await clickCta();

        expect(back).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
      });
    });
  });
});
