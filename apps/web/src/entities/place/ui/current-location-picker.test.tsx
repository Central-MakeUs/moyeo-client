import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CurrentLocationResult } from '@repo/types';

import type { ReverseGeocodingResponse } from '@/shared/api';
import { runBackHandlers } from '@/shared/model';

import type { PinAddressState } from '../model/use-pin-address';
import { CurrentLocationPicker } from './current-location-picker';

// 상태별 렌더를 제어하려면 좌표 획득을 목으로 고정해야 한다.
// jsdom에는 Geolocation API가 없어 목이 없으면 항상 실패 상태로만 뜬다.
const { useCurrentLocation } = vi.hoisted(() => ({ useCurrentLocation: vi.fn() }));
const { usePinAddress } = vi.hoisted(() => ({ usePinAddress: vi.fn() }));

vi.mock('../model/use-current-location', () => ({ useCurrentLocation }));
vi.mock('../model/use-pin-address', () => ({ usePinAddress }));

// 지도 자체는 슬라이스 3에서 검증했다. 여기서는 렌더 여부와, 화면이 카메라를 어떻게
// 명령하는지만 본다. moveTo 구현은 map-location-picker.test.tsx가 검증한다.
const { moveTo } = vi.hoisted(() => ({ moveTo: vi.fn() }));

vi.mock('@/shared/ui/map-location-picker', () => ({
  MapLocationPicker: ({ ref }: { ref?: React.Ref<{ moveTo: (coords: unknown) => void }> }) => {
    React.useImperativeHandle(ref, () => ({ moveTo }));

    return <div aria-label="지도" />;
  },
}));

const retry = vi.fn();
const requestAddress = vi.fn();
const startMoving = vi.fn();
const retryAddress = vi.fn();

const SUCCESS: CurrentLocationResult = {
  state: 'success',
  coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 },
};

const PIN = { latitude: 37.57, longitude: 126.98 };

const SEOUL_DETAILS: ReverseGeocodingResponse = {
  roadAddress: '서울특별시 중구 세종대로 110',
  jibunAddress: '서울 중구 태평로1가 31',
  isSupportedRegion: true,
};

/** 지정하지 않은 필드는 "아직 아무것도 조회하지 않은" 기본값이다. */
const mockGeocode = (state: Partial<PinAddressState> = {}) => {
  usePinAddress.mockReturnValue({
    state: {
      lastResult: null,
      requestStatus: 'idle',
      canConfirmLocation: false,
      ...state,
    },
    requestAddress,
    startMoving,
    retry: retryAddress,
  });
};

const RESOLVED_SEOUL = { details: SEOUL_DETAILS, coords: PIN };

/** 지원 지역(서울·경기) 밖 주소. */
/** 지원 지역(서울·경기) 밖 주소. 판정은 서버가 한다. */
const BUSAN_DETAILS: ReverseGeocodingResponse = {
  roadAddress: '부산광역시 해운대구 해운대해변로 264',
  jibunAddress: '부산 해운대구 우동 1413',
  isSupportedRegion: false,
};

const RESOLVED_BUSAN = { details: BUSAN_DETAILS, coords: PIN };

/** 정확도만 바꾼 성공 결과. */
const successWithAccuracy = (accuracy: number | null): CurrentLocationResult => ({
  state: 'success',
  coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy },
});

const OUT_OF_REGION_MESSAGE = '서울·경기 내 주소만 선택할 수 있어요';
const LOW_ACCURACY_MESSAGE = '위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요';
const CONFIRM_HINT_MESSAGE = '표시된 주소가 맞는지 확인해주세요.';

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
    render(<CurrentLocationPicker onClose={onClose} onConfirm={vi.fn()} />);

    // true를 반환해야 아래 PlaceSearchView 핸들러로 내려가지 않는다 (spec-fixed.md §4-3).
    expect(runBackHandlers()).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('inviteCode prop을 받으면 usePinAddress에 그대로 전달한다', () => {
    render(<CurrentLocationPicker inviteCode="ABC123" onClose={vi.fn()} onConfirm={vi.fn()} />);

    // 게스트는 Access Token이 없어 이 값이 빠지면 주소 조회가 401로 실패한다.
    expect(usePinAddress).toHaveBeenCalledWith('ABC123');
  });

  it('화면 내 뒤로가기 버튼을 클릭하면 onClose가 1회 호출된다', async () => {
    const onClose = vi.fn();
    render(<CurrentLocationPicker onClose={onClose} onConfirm={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('좌표 요청 중이면 로딩 상태가 안내되고 확인 CTA가 비활성이다', () => {
    mockLocation(null);

    render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('status', { name: '현재 위치를 찾고 있어요' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
  });

  it('denied면 다시 시도와 검색으로 돌아가기가 렌더되고 지도는 렌더되지 않는다', () => {
    mockLocation({ state: 'denied' });

    render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '검색으로 돌아가기' })).toBeInTheDocument();
    // 지도는 슬라이스 3에서 `aria-label="지도"` 로 들어온다. 실패 상태에서는 없어야 한다.
    expect(screen.queryByLabelText('지도')).not.toBeInTheDocument();
  });

  it('timeout에서 다시 시도를 클릭하면 좌표를 다시 요청한다', async () => {
    mockLocation({ state: 'timeout' });

    render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  describe('주소 카드', () => {
    it('최초 좌표를 확보하면 그 좌표로 역지오코딩이 정확히 1회 시작된다', () => {
      mockLocation(SUCCESS);

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      // 사용자가 지도를 움직이지 않아도 첫 주소를 조회한다.
      expect(requestAddress).toHaveBeenCalledTimes(1);
      expect(requestAddress).toHaveBeenCalledWith(SUCCESS.coords);
    });

    it('최초 주소를 조회하는 동안에는 주소 스켈레톤과 비활성 CTA가 표시된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({ requestStatus: 'resolving' });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

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

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
      expect(screen.getByText('서울 중구 태평로1가 31')).toBeInTheDocument();
    });

    it('도로명이 없으면 지번만 렌더된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: {
          details: { ...SEOUL_DETAILS, roadAddress: null },
          coords: PIN,
        },
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

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

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

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

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

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

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(screen.getByText('서울특별시 중구 세종대로 110')).toBeInTheDocument();
      expect(screen.getByText('주소를 확인할 수 없어요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '이 위치로 주소 등록' })).toBeDisabled();
    });

    it('역지오코딩이 실패하면 "주소를 확인할 수 없어요"와 "다시 시도"가 렌더되고 지도는 그대로 표시된다', () => {
      mockLocation(SUCCESS);
      mockGeocode({ requestStatus: 'failed' });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(screen.getByText('주소를 확인할 수 없어요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      // 좌표 획득 실패와 달리 지도는 살려둔다 (§7).
      expect(screen.getByLabelText('지도')).toBeInTheDocument();
    });

    it('주소 조회 실패에서 다시 시도를 클릭하면 마지막 핀 좌표로 재조회한다', async () => {
      mockLocation(SUCCESS);
      mockGeocode({ requestStatus: 'failed' });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      // 좌표 재요청(retry)이 아니라 주소 재조회(retryAddress)여야 한다.
      expect(retryAddress).toHaveBeenCalledTimes(1);
      expect(retry).not.toHaveBeenCalled();
    });
  });

  describe('확인 CTA', () => {
    const getCta = () => screen.getByRole('button', { name: '이 위치로 주소 등록' });

    it('확정 주소를 확보하면 확인 CTA가 활성이다', () => {
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(getCta()).toBeEnabled();
    });

    it('활성 CTA를 클릭하면 onConfirm이 도로명 주소와 핀 좌표로 1회 호출된다', async () => {
      const onConfirm = vi.fn();
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={onConfirm} />);
      await userEvent.click(getCta());

      expect(onConfirm).toHaveBeenCalledTimes(1);
      // 좌표는 현재 GPS 좌표(SUCCESS.coords)가 아니라 조회 당시의 핀 좌표다 (§6-2).
      expect(onConfirm).toHaveBeenCalledWith({
        name: '서울특별시 중구 세종대로 110',
        address: '서울특별시 중구 세종대로 110',
        latitude: 37.57,
        longitude: 126.98,
      });
    });

    it('도로명이 없고 지번만 있으면 CTA가 활성이고 onConfirm이 지번 주소로 호출된다', async () => {
      const onConfirm = vi.fn();
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: {
          details: { ...SEOUL_DETAILS, roadAddress: null },
          coords: PIN,
        },
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={onConfirm} />);
      expect(getCta()).toBeEnabled();

      await userEvent.click(getCta());

      expect(onConfirm).toHaveBeenCalledWith({
        name: '서울 중구 태평로1가 31',
        address: '서울 중구 태평로1가 31',
        latitude: 37.57,
        longitude: 126.98,
      });
    });

    it('지도 이동 중이면 이전 주소가 남아 있어도 CTA가 비활성이고 클릭해도 onConfirm이 호출되지 않는다', async () => {
      const onConfirm = vi.fn();
      mockLocation(SUCCESS);
      // 이동 중에는 lastResult가 현재 핀의 주소가 아니다.
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolved',
        canConfirmLocation: false,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={onConfirm} />);
      expect(getCta()).toBeDisabled();

      await userEvent.click(getCta());

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('도로명과 지번이 모두 없으면 CTA가 비활성이다', () => {
      mockLocation(SUCCESS);
      // 확정 주소가 아니다 — toDepartureDraft가 null을 반환한다 (§6-2).
      mockGeocode({
        lastResult: {
          details: { ...SEOUL_DETAILS, roadAddress: null, jibunAddress: null },
          coords: PIN,
        },
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(getCta()).toBeDisabled();
    });

    it('새 좌표의 주소 조회가 실패해 직전 주소만 남은 상태면 CTA가 비활성이고 클릭해도 onConfirm이 호출되지 않는다', async () => {
      const onConfirm = vi.fn();
      mockLocation(SUCCESS);
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'failed',
        canConfirmLocation: false,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={onConfirm} />);
      expect(getCta()).toBeDisabled();

      await userEvent.click(getCta());

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('지원 지역과 정확도 안내', () => {
    const getCta = () => screen.getByRole('button', { name: '이 위치로 주소 등록' });

    /** 확정 주소를 확보한 상태 — 여기서부터 지역·정확도 판정이 갈린다. */
    const resolved = (lastResult: PinAddressState['lastResult']) => {
      mockGeocode({ lastResult, requestStatus: 'resolved', canConfirmLocation: true });
    };

    const renderPicker = () => {
      const view = render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      return {
        rerender: () =>
          view.rerender(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />),
      };
    };

    it('isSupportedRegion이 false면 지도는 렌더되고 서울·경기 안내와 함께 CTA가 비활성이다', () => {
      mockLocation(SUCCESS);
      resolved(RESOLVED_BUSAN);

      renderPicker();

      // 진입 즉시 막지 않는다 — 지도를 옮겨 지원 지역으로 갈 수 있어야 한다 (§7).
      expect(screen.getByLabelText('지도')).toBeInTheDocument();
      expect(screen.getByText(OUT_OF_REGION_MESSAGE)).toBeInTheDocument();
      expect(getCta()).toBeDisabled();
    });

    it('accuracy가 150이고 주소가 서울이면 정확도 안내가 렌더되고 CTA는 활성이다', () => {
      mockLocation(successWithAccuracy(150));
      // 진입 직후 — 첫 조회는 GPS 좌표 그대로 들어간다 (핀을 아직 옮기지 않았다).
      resolved({
        details: SEOUL_DETAILS,
        coords: { latitude: 37.5666805, longitude: 126.9784147 },
      });

      renderPicker();

      // 정확도 하한을 두지 않는다 — 안내만 덧붙이고 확정은 막지 않는다 (§5-3).
      expect(screen.getByText(LOW_ACCURACY_MESSAGE)).toBeInTheDocument();
      expect(getCta()).toBeEnabled();
    });

    it('지원 지역 밖으로 CTA가 비활성인 상태에서 서울 주소로 갱신되면 CTA가 활성이 되고 안내가 사라진다', () => {
      mockLocation(SUCCESS);
      resolved(RESOLVED_BUSAN);

      const { rerender } = renderPicker();
      expect(getCta()).toBeDisabled();

      // 지도를 옮겨 새 idle이 서울 주소로 확정된 상황.
      resolved(RESOLVED_SEOUL);
      rerender();

      expect(getCta()).toBeEnabled();
      expect(screen.queryByText(OUT_OF_REGION_MESSAGE)).not.toBeInTheDocument();
    });

    it('accuracy가 정확히 100이면 정확도 안내 대신 기본 확인 문구가 렌더된다', () => {
      mockLocation(successWithAccuracy(100));
      resolved(RESOLVED_SEOUL);

      renderPicker();

      // 조건은 100 초과다. 100은 경계 안쪽이라 안내하지 않는다.
      expect(screen.queryByText(LOW_ACCURACY_MESSAGE)).not.toBeInTheDocument();
      expect(screen.getByText(CONFIRM_HINT_MESSAGE)).toBeInTheDocument();
    });

    it('accuracy가 null이면 정확도 안내가 렌더되지 않는다', () => {
      mockLocation(successWithAccuracy(null));
      resolved(RESOLVED_SEOUL);

      renderPicker();

      // 브라우저가 값을 주지 않은 것이지 부정확하다는 뜻이 아니다.
      expect(screen.queryByText(LOW_ACCURACY_MESSAGE)).not.toBeInTheDocument();
    });

    it('지원 지역 밖이면서 accuracy가 150이면 서울·경기 안내만 렌더된다', () => {
      mockLocation(successWithAccuracy(150));
      resolved(RESOLVED_BUSAN);

      renderPicker();

      // 차단 사유를 먼저 알려야 사용자가 지도를 옮긴다.
      expect(screen.getByText(OUT_OF_REGION_MESSAGE)).toBeInTheDocument();
      expect(screen.queryByText(LOW_ACCURACY_MESSAGE)).not.toBeInTheDocument();
    });

    it('isSupportedRegion이 undefined면 CTA가 비활성이고 서울·경기 안내가 렌더된다', () => {
      mockLocation(SUCCESS);
      // 주소는 확정되지만 서버가 지역을 판정하지 못한 경우다. `!== true` 로 막아야 한다.
      resolved({
        details: { ...SEOUL_DETAILS, isSupportedRegion: undefined },
        coords: PIN,
      });

      renderPicker();

      expect(getCta()).toBeDisabled();
      expect(screen.getByText(OUT_OF_REGION_MESSAGE)).toBeInTheDocument();
    });

    it('지도 이동 중이면 직전 주소의 안내를 유지해 서울·경기 안내가 그대로 렌더되고 CTA는 비활성이다', () => {
      mockLocation(SUCCESS);
      // 이동 중에도 안내는 직전 결과를 따라간다. 확정만 canConfirmLocation이 막는다.
      mockGeocode({
        lastResult: RESOLVED_BUSAN,
        requestStatus: 'resolved',
        canConfirmLocation: false,
      });

      renderPicker();

      expect(screen.getByText(OUT_OF_REGION_MESSAGE)).toBeInTheDocument();
      expect(getCta()).toBeDisabled();
    });

    it('accuracy가 150이어도 핀 좌표가 최초 GPS 좌표와 다르면 정확도 안내 대신 기본 확인 문구가 렌더된다', () => {
      mockLocation(successWithAccuracy(150));
      // 사용자가 지도를 옮겨 확정한 위치다 — 측정 정확도를 말할 자리가 아니다.
      resolved({ details: SEOUL_DETAILS, coords: { latitude: 37.58, longitude: 126.99 } });

      renderPicker();

      expect(screen.queryByText(LOW_ACCURACY_MESSAGE)).not.toBeInTheDocument();
      expect(screen.getByText(CONFIRM_HINT_MESSAGE)).toBeInTheDocument();
    });

    it('지도를 옮겼다가 최초 GPS 좌표와 같은 지점으로 다시 확정되면 정확도 안내가 다시 렌더된다', () => {
      mockLocation(successWithAccuracy(150));
      resolved({ details: SEOUL_DETAILS, coords: { latitude: 37.58, longitude: 126.99 } });

      const { rerender } = renderPicker();
      expect(screen.queryByText(LOW_ACCURACY_MESSAGE)).not.toBeInTheDocument();

      // 판정은 좌표 동일성뿐이다. dragstart 이력을 따로 기억하지 않는다.
      resolved({
        details: SEOUL_DETAILS,
        coords: { latitude: 37.5666805, longitude: 126.9784147 },
      });
      rerender();

      expect(screen.getByText(LOW_ACCURACY_MESSAGE)).toBeInTheDocument();
    });
  });

  describe('현재 위치로 이동', () => {
    const queryRecenterButton = () => screen.queryByRole('button', { name: '현재 위치로 이동' });

    it('좌표를 확보하면 현재 위치로 이동 버튼이 렌더된다', () => {
      mockLocation(SUCCESS);

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(queryRecenterButton()).toBeInTheDocument();
    });

    it('현재 위치로 이동을 클릭하면 지도의 moveTo가 최초 GPS 좌표로 1회 호출된다', async () => {
      mockLocation(SUCCESS);
      // 지도를 옮겨 다른 주소를 보고 있는 상태에서 되돌린다.
      mockGeocode({
        lastResult: RESOLVED_SEOUL,
        requestStatus: 'resolved',
        canConfirmLocation: true,
      });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: '현재 위치로 이동' }));

      expect(moveTo).toHaveBeenCalledTimes(1);
      expect(moveTo).toHaveBeenCalledWith(SUCCESS.coords);
    });

    it('현재 위치로 이동을 클릭해도 좌표를 다시 요청하지 않는다', async () => {
      mockLocation(SUCCESS);

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);
      await userEvent.click(screen.getByRole('button', { name: '현재 위치로 이동' }));

      // 재요청하면 권한 팝업이 다시 뜬다 (F06).
      expect(retry).not.toHaveBeenCalled();
    });

    it('좌표 요청 중이면 현재 위치로 이동 버튼이 렌더되지 않는다', () => {
      mockLocation(null);

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(queryRecenterButton()).not.toBeInTheDocument();
    });

    it('좌표 획득에 실패하면 현재 위치로 이동 버튼이 렌더되지 않는다', () => {
      mockLocation({ state: 'denied' });

      render(<CurrentLocationPicker onClose={vi.fn()} onConfirm={vi.fn()} />);

      expect(queryRecenterButton()).not.toBeInTheDocument();
    });
  });
});
