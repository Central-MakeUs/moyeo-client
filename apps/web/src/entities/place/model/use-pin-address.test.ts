import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';

import type { ReverseGeocodingResponse } from '@/shared/api';

const { reverseGeocode, useQuery } = vi.hoisted(() => ({
  reverseGeocode: vi.fn(),
  useQuery: vi.fn(),
}));

// useQuery를 목으로 두면 실제 QueryClient 없이 옵션과 파생 상태를 모두 검증할 수 있다.
// use-place-search.test.ts 와 같은 방식이다.
vi.mock('@/shared/api', () => ({ reverseGeocode }));
vi.mock('@tanstack/react-query', () => ({ useQuery }));

import { usePinAddress } from './use-pin-address';

const SEOUL_CITY_HALL = { latitude: 37.5666805, longitude: 126.9784147 };
const GANGNAM_STATION = { latitude: 37.4979, longitude: 127.0276 };

const SEOUL_DETAILS: ReverseGeocodingResponse = {
  roadAddress: '서울특별시 중구 세종대로 110',
  jibunAddress: '서울 중구 태평로1가 31',
  isSupportedRegion: true,
};

/** `useQuery` 가 돌려줄 상태. 지정하지 않은 필드는 "아직 아무것도 없음"이다. */
const mockQuery = (overrides: Record<string, unknown> = {}) => {
  useQuery.mockReturnValue({
    data: undefined,
    isSuccess: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  });
};

/** 가장 최근 렌더에서 useQuery에 전달된 옵션. */
const lastOptions = () => useQuery.mock.calls.at(-1)?.[0] as Record<string, any>;

const resolvedWith = (coords: typeof SEOUL_CITY_HALL) => ({
  data: { details: SEOUL_DETAILS, coords },
  isSuccess: true,
});

const axiosErrorWith = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    data: undefined,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery();
});

describe('usePinAddress', () => {
  it('requestAddress({ latitude: 37.5666805, longitude: 126.9784147 })를 부르면 그 좌표를 담은 params로 enabled true가 된다', () => {
    const { result } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));

    expect(lastOptions().enabled).toBe(true);
    expect(lastOptions().queryKey).toEqual([
      'departure-place-reverse-geocode',
      { latitude: 37.5666805, longitude: 126.9784147 },
    ]);
  });

  it('inviteCode를 넘기면 params와 query key에 inviteCode가 포함된다', () => {
    const { result } = renderHook(() => usePinAddress('ABC123'));

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));

    // 비회원 요청은 Access Token 대신 inviteCode로 권한을 증명한다.
    expect(lastOptions().queryKey).toEqual([
      'departure-place-reverse-geocode',
      { latitude: 37.5666805, longitude: 126.9784147, inviteCode: 'ABC123' },
    ]);
  });

  it('조회가 성공하면 lastResult가 { details, coords }로 저장되고 requestStatus가 resolved, canConfirmLocation이 true가 된다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    mockQuery(resolvedWith(SEOUL_CITY_HALL));
    act(() => rerender());

    expect(result.current.state.lastResult).toEqual({
      details: SEOUL_DETAILS,
      coords: SEOUL_CITY_HALL,
    });
    expect(result.current.state.requestStatus).toBe('resolved');
    expect(result.current.state.canConfirmLocation).toBe(true);
  });

  it('staleTime이 Infinity, gcTime이 600000으로 useQuery에 전달된다', () => {
    renderHook(() => usePinAddress());

    // 같은 좌표는 picker 사용 중 다시 조회하지 않고, 메모리 보유 시간만 제한한다.
    expect(lastOptions().staleTime).toBe(Infinity);
    expect(lastOptions().gcTime).toBe(600_000);
  });

  it('requestAddress 이전에는 enabled가 false이고 requestStatus가 idle이다', () => {
    const { result } = renderHook(() => usePinAddress());

    expect(lastOptions().enabled).toBe(false);
    expect(result.current.state.requestStatus).toBe('idle');
  });

  it('새 좌표를 조회 중이면 lastResult를 갱신하지 않고 requestStatus가 resolving이다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    mockQuery({ isFetching: true });
    act(() => rerender());

    expect(result.current.state.lastResult).toBeNull();
    expect(result.current.state.requestStatus).toBe('resolving');
  });

  it('A 좌표 성공 후 B 좌표로 resolve하면 lastResult는 A를 유지하지만 canConfirmLocation은 false다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    mockQuery(resolvedWith(SEOUL_CITY_HALL));
    act(() => rerender());

    // B로 옮긴 직후 — query 성공 렌더와 lastResult 갱신 사이에는 한 렌더 간극이 있다.
    // 좌표 일치를 확인하지 않으면 직전 핀의 주소로 CTA가 활성화된다.
    act(() => result.current.requestAddress(GANGNAM_STATION));

    expect(result.current.state.lastResult?.coords).toEqual(SEOUL_CITY_HALL);
    expect(result.current.state.canConfirmLocation).toBe(false);
  });

  it('같은 좌표로 requestAddress를 다시 부르면 query key가 바뀌지 않는다', () => {
    const { result } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    const keyAfterFirst = lastOptions().queryKey;

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));

    // 지도 생성 직후의 초기 idle이 같은 좌표로 들어온다. 재조회를 걸지 않는다.
    expect(lastOptions().queryKey).toEqual(keyAfterFirst);
  });

  it('query 상태가 바뀌어 리렌더돼도 requestAddress 함수 참조를 유지한다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());
    const initialRequestAddress = result.current.requestAddress;

    mockQuery({ isFetching: true });
    rerender();

    // 소비 컴포넌트의 effect가 함수 변경만으로 다시 실행되어 초기 좌표를 덮어쓰지 않아야 한다.
    expect(result.current.requestAddress).toBe(initialRequestAddress);
  });

  it('startMoving() 이후에는 requestStatus가 resolved여도 canConfirmLocation이 false다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    mockQuery(resolvedWith(SEOUL_CITY_HALL));
    act(() => rerender());

    act(() => result.current.startMoving());

    expect(result.current.state.requestStatus).toBe('resolved');
    expect(result.current.state.canConfirmLocation).toBe(false);
  });

  it('조회가 실패하면 requestStatus가 failed가 되고 직전 lastResult는 유지된다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    mockQuery(resolvedWith(SEOUL_CITY_HALL));
    act(() => rerender());

    act(() => result.current.requestAddress(GANGNAM_STATION));
    mockQuery({ isError: true });
    act(() => rerender());

    expect(result.current.state.requestStatus).toBe('failed');
    // 새 좌표 조회가 실패해도 주소 카드는 직전 주소를 계속 보여준다.
    expect(result.current.state.lastResult?.coords).toEqual(SEOUL_CITY_HALL);
  });

  it('실패 후 다시 조회 중이면 requestStatus가 resolving이다', () => {
    const { result, rerender } = renderHook(() => usePinAddress());

    act(() => result.current.requestAddress(SEOUL_CITY_HALL));
    mockQuery({ isError: true, isFetching: true });
    act(() => rerender());

    expect(result.current.state.requestStatus).toBe('resolving');
  });

  it('401 응답에는 retry가 false를 반환한다', () => {
    renderHook(() => usePinAddress());

    // 인증 실패는 재시도해도 결과가 같다.
    expect(lastOptions().retry(0, axiosErrorWith(401))).toBe(false);
  });

  it('핀 좌표가 없는 상태에서 queryFn이 실행되면 에러를 던진다', async () => {
    renderHook(() => usePinAddress());

    // enabled는 타입을 좁혀주지 않는다. 계약을 런타임으로도 고정한다.
    await expect(lastOptions().queryFn({ signal: undefined })).rejects.toThrow();
    expect(reverseGeocode).not.toHaveBeenCalled();
  });
});
