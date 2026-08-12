import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CurrentLocationResult } from '@repo/types';

import type { Coord2AddressDocument } from '@/shared/lib/kakao-map-sdk';
import { runBackHandlers } from '@/shared/model';

import type { ReverseGeocodeState } from '../model/use-reverse-geocode';
import { CurrentLocationPicker } from './current-location-picker';

// 상태별 렌더를 제어하려면 좌표 획득을 목으로 고정해야 한다.
// jsdom에는 Geolocation API가 없어 목이 없으면 항상 실패 상태로만 뜬다.
const { useCurrentLocation } = vi.hoisted(() => ({ useCurrentLocation: vi.fn() }));
const { useReverseGeocode } = vi.hoisted(() => ({ useReverseGeocode: vi.fn() }));

vi.mock('../model/use-current-location', () => ({ useCurrentLocation }));
vi.mock('../model/use-reverse-geocode', () => ({ useReverseGeocode }));

// 지도 자체는 슬라이스 3에서 검증했다. 여기서는 렌더 여부만 본다.
vi.mock('@/shared/ui/map-location-picker', () => ({
  MapLocationPicker: () => <div aria-label="지도" />,
}));

const retry = vi.fn();
const resolveAddress = vi.fn();
const startMoving = vi.fn();
const retryAddress = vi.fn();

const SUCCESS: CurrentLocationResult = {
  state: 'success',
  coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 },
};

const PIN = { latitude: 37.57, longitude: 126.98 };

const ROAD_AND_JIBUN: Coord2AddressDocument = {
  road_address: { address_name: '서울특별시 중구 세종대로 110' },
  address: { address_name: '서울 중구 태평로1가 31', region_1depth_name: '서울' },
};

/** 지정하지 않은 필드는 "아직 아무것도 조회하지 않은" 기본값이다. */
const mockGeocode = (state: Partial<ReverseGeocodeState> = {}) => {
  useReverseGeocode.mockReturnValue({
    state: {
      lastResult: null,
      requestStatus: 'idle',
      canConfirmLocation: false,
      ...state,
    },
    resolve: resolveAddress,
    startMoving,
    retry: retryAddress,
  });
};

const RESOLVED_SEOUL = { document: ROAD_AND_JIBUN, coords: PIN };

/** `null` 이면 좌표 요청 중이다. */
const mockLocation = (result: CurrentLocationResult | null) => {
  useCurrentLocation.mockReturnValue({ result, retry });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLocation(null);
  mockGeocode();
});

describe('CurrentLocationPicker', () => {
  it('마운트된 상태에서 runBackHandlers()를 실행하면 onClose가 1회 호출되고 true를 반환한다', () => {
    const onClose = vi.fn();
    render(<CurrentLocationPicker onClose={onClose} />);

    // true를 반환해야 아래 PlaceSearchView 핸들러로 내려가지 않는다 (spec-fixed.md §4-3).
    expect(runBackHandlers()).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('화면 내 뒤로가기 버튼을 클릭하면 onClose가 1회 호출된다', async () => {
    const onClose = vi.fn();
    render(<CurrentLocationPicker onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('좌표 요청 중이면 로딩 상태가 안내되고 확인 CTA가 비활성이다', () => {
    mockLocation(null);

    render(<CurrentLocationPicker onClose={vi.fn()} />);

    expect(screen.getByRole('status', { name: '현재 위치를 찾고 있어요' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
  });

  it('denied면 다시 시도와 검색으로 돌아가기가 렌더되고 지도는 렌더되지 않는다', () => {
    mockLocation({ state: 'denied' });

    render(<CurrentLocationPicker onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '검색으로 돌아가기' })).toBeInTheDocument();
    // 지도는 슬라이스 3에서 `aria-label="지도"` 로 들어온다. 실패 상태에서는 없어야 한다.
    expect(screen.queryByLabelText('지도')).not.toBeInTheDocument();
  });

  it('timeout에서 다시 시도를 클릭하면 좌표를 다시 요청한다', async () => {
    mockLocation({ state: 'timeout' });

    render(<CurrentLocationPicker onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  describe('주소 카드', () => {
    it('최초 좌표를 확보하면 그 좌표로 역지오코딩이 정확히 1회 시작된다', () => {
      mockLocation(SUCCESS);

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      // 사용자가 지도를 움직이지 않아도 첫 주소를 조회한다.
      expect(resolveAddress).toHaveBeenCalledTimes(1);
      expect(resolveAddress).toHaveBeenCalledWith(SUCCESS.coords);
    });

    it('최초 주소를 조회하는 동안에는 주소 스켈레톤과 비활성 CTA가 표시된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({ requestStatus: 'resolving' });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
      expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
    });

    it('주소가 확정되면 도로명과 지번이 함께 렌더된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
      expect(screen.getByText('서울 중구 태평로1가 31')).toBeInTheDocument();
    });

    it('도로명이 없으면 지번만 렌더된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: {
          document: { road_address: null, address: ROAD_AND_JIBUN.address },
          coords: PIN,
        },
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByText('서울 중구 태평로1가 31')).toBeInTheDocument();
      expect(screen.queryByText('서울특별시 중구 세종대로 110')).not.toBeInTheDocument();
    });

    it('지도 이동이 시작돼도 이전 주소가 남고 확인 CTA는 비활성이다', () => {
      mockLocation(SUCCESS);
      // startMoving() 직후 — 주소는 그대로, 확정만 막힌 상태.
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolved',
        canConfirmLocation: false,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
    });

    it('새 주소를 조회하는 동안에도 이전 주소가 남고 확인 CTA는 비활성이다', () => {
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolving',
        canConfirmLocation: false,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
    });

    it('이전 주소가 있는 상태에서 새 좌표 조회가 실패하면 이전 주소와 오류 안내, 다시 시도가 함께 표시되고 CTA는 비활성이다', () => {
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'failed',
        canConfirmLocation: false,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
      expect(screen.getByText('주소를 확인할 수 없어요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
    });

    it('역지오코딩이 실패하면 "주소를 확인할 수 없어요"와 "다시 시도"가 렌더되고 지도는 그대로 표시된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({ requestStatus: 'failed' });

      render(<CurrentLocationPicker onClose={vi.fn()} />);

      expect(screen.getByText('주소를 확인할 수 없어요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      // 좌표 획득 실패와 달리 지도는 살려둔다 (§7).
      expect(screen.getByLabelText('지도')).toBeInTheDocument();
    });

    it('주소 조회 실패에서 다시 시도를 클릭하면 마지막 핀 좌표로 재조회한다', async () => {
      mockLocation(SUCCESS);
      mockGeocode({ requestStatus: 'failed' });

      render(<CurrentLocationPicker onClose={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      // 좌표 재요청(retry)이 아니라 주소 재조회(retryAddress)여야 한다.
      expect(retryAddress).toHaveBeenCalledTimes(1);
      expect(retry).not.toHaveBeenCalled();
    });
  });
});
