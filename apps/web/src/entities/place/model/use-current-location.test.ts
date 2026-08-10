import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useCurrentLocation } from './use-current-location';

const getCurrentPosition = vi.fn();

/** jsdom은 Geolocation API를 구현하지 않는다. 매번 직접 심고 되돌린다. */
const setGeolocation = (value: unknown) => {
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true, writable: true });
};

const SEOUL_CITY_HALL = { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 };

/** getCurrentPosition에 전달된 성공·실패 콜백을 꺼낸다. */
const callbacksOf = (callIndex: number) =>
  getCurrentPosition.mock.calls[callIndex] as [
    (position: unknown) => void,
    (error: unknown) => void,
  ];

beforeEach(() => {
  getCurrentPosition.mockReset();
  setGeolocation({ getCurrentPosition });
});

afterEach(() => {
  setGeolocation(undefined);
});

describe('useCurrentLocation', () => {
  it('마운트하면 getCurrentPosition이 { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 옵션으로 정확히 1회 호출된다', () => {
    renderHook(() => useCurrentLocation());

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    });
  });

  it('요청이 끝나기 전에는 result가 null이다', () => {
    const { result } = renderHook(() => useCurrentLocation());

    expect(result.current.result).toBeNull();
  });

  it('성공 콜백이 오면 result.state가 "success"가 된다', () => {
    const { result } = renderHook(() => useCurrentLocation());

    act(() => {
      const [onSuccess] = callbacksOf(0);
      onSuccess({ coords: SEOUL_CITY_HALL, timestamp: 0 });
    });

    expect(result.current.result).toEqual({ state: 'success', coords: SEOUL_CITY_HALL });
  });

  it('code가 1인 실패 콜백이 오면 result.state가 "denied"가 된다', () => {
    const { result } = renderHook(() => useCurrentLocation());

    act(() => {
      const [, onError] = callbacksOf(0);
      onError({ code: 1, message: '' });
    });

    expect(result.current.result).toEqual({ state: 'denied' });
  });

  it('실패한 뒤 retry()를 부르면 getCurrentPosition이 한 번 더 호출되고 result가 다시 null이 된다', () => {
    const { result } = renderHook(() => useCurrentLocation());

    act(() => {
      const [, onError] = callbacksOf(0);
      onError({ code: 1, message: '' });
    });
    act(() => result.current.retry());

    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(result.current.result).toBeNull();
  });

  it('요청이 끝나기 전에 retry()를 부르면 getCurrentPosition이 추가로 호출되지 않는다', () => {
    const { result } = renderHook(() => useCurrentLocation());

    act(() => result.current.retry());

    // 권한 팝업이 겹쳐 뜨는 것을 막는다.
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('navigator.geolocation이 없으면 result.state가 "error"가 되고 getCurrentPosition을 호출하지 않는다', () => {
    setGeolocation(undefined);

    const { result } = renderHook(() => useCurrentLocation());

    expect(result.current.result).toEqual({ state: 'error' });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
