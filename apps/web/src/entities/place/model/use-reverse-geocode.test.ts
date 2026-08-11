import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import type { Coord2AddressDocument } from '@/shared/lib/kakao-map-sdk';

import { useReverseGeocode } from './use-reverse-geocode';

const { loadKakaoMapSdk } = vi.hoisted(() => ({ loadKakaoMapSdk: vi.fn() }));

vi.mock('@/shared/lib/kakao-map-sdk', () => ({ loadKakaoMapSdk }));

const SEOUL_CITY_HALL = { latitude: 37.5666805, longitude: 126.9784147 };
const GANGNAM_STATION = { latitude: 37.4979, longitude: 127.0276 };

const SEOUL_DOCUMENT: Coord2AddressDocument = {
  road_address: { address_name: '서울특별시 중구 세종대로 110' },
  address: { address_name: '서울 중구 태평로1가 31', region_1depth_name: '서울' },
};

const GANGNAM_DOCUMENT: Coord2AddressDocument = {
  road_address: { address_name: '서울특별시 강남구 강남대로 396' },
  address: { address_name: '서울 강남구 역삼동 858', region_1depth_name: '서울' },
};

const coord2Address = vi.fn();
const maps = {
  services: {
    // `new` 로 호출되는 목은 화살표 함수면 안 된다 (`not a constructor`).
    Geocoder: vi.fn(function () {
      return { coord2Address };
    }),
    Status: { OK: 'OK' },
  },
};

/** n번째 coord2Address 호출에 넘어간 콜백을 꺼낸다. */
const getCoord2AddressCallback = (callIndex: number) =>
  coord2Address.mock.calls[callIndex]?.[2] as (
    result: Coord2AddressDocument[],
    status: string
  ) => void;

beforeEach(() => {
  vi.clearAllMocks();
  loadKakaoMapSdk.mockResolvedValue(maps);
});

describe('useReverseGeocode', () => {
  it('resolve({ latitude: 37.5666805, longitude: 126.9784147 })를 부르면 coord2Address(126.9784147, 37.5666805, cb)가 정확히 1회 호출된다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));

    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(1));
    // 카카오는 경도가 먼저다.
    expect(coord2Address).toHaveBeenCalledWith(126.9784147, 37.5666805, expect.any(Function));
  });

  it('성공하면 lastResult에 document와 핀 좌표가 담기고 확정 가능해진다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));

    expect(result.current.state.lastResult).toEqual({
      document: SEOUL_DOCUMENT,
      coords: SEOUL_CITY_HALL,
    });
    expect(result.current.state.requestStatus).toBe('resolved');
    expect(result.current.state.canConfirmLocation).toBe(true);
  });

  it('같은 좌표로 다시 resolve하면 coord2Address가 추가로 호출되지 않는다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(1));
    act(() => result.current.resolve(SEOUL_CITY_HALL));

    // 지도 생성 직후의 초기 idle이 같은 좌표로 들어온다.
    expect(coord2Address).toHaveBeenCalledTimes(1);
  });

  it('startMoving()을 부르면 마지막 성공 결과는 유지되고 확정할 수 없게 된다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));
    act(() => result.current.startMoving());

    expect(result.current.state.lastResult?.document).toBe(SEOUL_DOCUMENT);
    expect(result.current.state.canConfirmLocation).toBe(false);
  });

  it('새 좌표를 조회하는 동안에도 이전 주소가 유지되고 확정할 수 없다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));
    act(() => result.current.resolve(GANGNAM_STATION));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(2));

    expect(result.current.state.requestStatus).toBe('resolving');
    expect(result.current.state.lastResult?.document).toBe(SEOUL_DOCUMENT);
    expect(result.current.state.canConfirmLocation).toBe(false);
  });

  it('새 좌표 조회가 성공하면 lastResult가 새 결과로 교체된다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));
    act(() => result.current.resolve(GANGNAM_STATION));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(2));
    act(() => getCoord2AddressCallback(1)([GANGNAM_DOCUMENT], 'OK'));

    expect(result.current.state.lastResult).toEqual({
      document: GANGNAM_DOCUMENT,
      coords: GANGNAM_STATION,
    });
    expect(result.current.state.requestStatus).toBe('resolved');
    expect(result.current.state.canConfirmLocation).toBe(true);
  });

  it('retry()는 이전 성공 결과의 좌표가 아니라 마지막 요청 좌표로 다시 조회한다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));
    act(() => result.current.resolve(GANGNAM_STATION));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(2));
    act(() => getCoord2AddressCallback(1)([], 'OK'));
    act(() => result.current.retry());

    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(3));
    expect(coord2Address).toHaveBeenLastCalledWith(127.0276, 37.4979, expect.any(Function));
  });

  it('이전 요청의 응답이 늦게 도착해도 최신 결과를 덮어쓰지 않는다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(1));
    act(() => result.current.resolve(GANGNAM_STATION));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(2));

    // 새 좌표가 먼저 도착하고, 오래된 좌표의 응답이 뒤늦게 온다.
    act(() => getCoord2AddressCallback(1)([GANGNAM_DOCUMENT], 'OK'));
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));

    expect(result.current.state.lastResult?.document).toBe(GANGNAM_DOCUMENT);
  });

  it('결과 배열이 비어 있으면 요청이 실패하고 이전 주소는 남는다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'OK'));
    act(() => result.current.resolve(GANGNAM_STATION));
    await waitFor(() => expect(coord2Address).toHaveBeenCalledTimes(2));
    act(() => getCoord2AddressCallback(1)([], 'OK'));

    expect(result.current.state.requestStatus).toBe('failed');
    expect(result.current.state.lastResult?.document).toBe(SEOUL_DOCUMENT);
    expect(result.current.state.canConfirmLocation).toBe(false);
  });

  it('콜백의 status가 OK가 아니면 요청 상태가 failed가 된다', async () => {
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));
    await waitFor(() => expect(coord2Address).toHaveBeenCalled());
    act(() => getCoord2AddressCallback(0)([SEOUL_DOCUMENT], 'ZERO_RESULT'));

    expect(result.current.state.requestStatus).toBe('failed');
    expect(result.current.state.lastResult).toBeNull();
  });

  it('SDK 로드에 실패하면 요청 상태가 failed가 되고 확정할 수 없다', async () => {
    loadKakaoMapSdk.mockRejectedValueOnce(new Error('SDK 로드 실패'));
    const { result } = renderHook(() => useReverseGeocode());

    act(() => result.current.resolve(SEOUL_CITY_HALL));

    await waitFor(() => expect(result.current.state.requestStatus).toBe('failed'));
    expect(result.current.state.canConfirmLocation).toBe(false);
  });
});
