import { describe, expect, it } from 'vitest';

import { toCurrentLocationError, toCurrentLocationResult } from './to-current-location-result';

/** jsdom에 Geolocation API가 없어 실제 인스턴스를 만들 수 없다. 구조만 맞춰 넘긴다. */
const positionOf = (coords: { latitude: number; longitude: number; accuracy: number | null }) =>
  ({ coords, timestamp: 0 }) as unknown as GeolocationPosition;

const errorOf = (code: number) => ({ code, message: '' }) as unknown as GeolocationPositionError;

describe('toCurrentLocationResult', () => {
  it('coords { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 }를 넘기면 같은 좌표의 success를 반환한다', () => {
    const result = toCurrentLocationResult(
      positionOf({ latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 })
    );

    expect(result).toEqual({
      state: 'success',
      coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 },
    });
  });

  it('accuracy가 null이면 coords.accuracy가 null인 success를 반환한다', () => {
    const result = toCurrentLocationResult(
      positionOf({ latitude: 37.5666805, longitude: 126.9784147, accuracy: null })
    );

    expect(result).toEqual({
      state: 'success',
      coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: null },
    });
  });
});

describe('toCurrentLocationError', () => {
  it('code가 1(PERMISSION_DENIED)이면 { state: "denied" }를 반환한다', () => {
    expect(toCurrentLocationError(errorOf(1))).toEqual({ state: 'denied' });
  });

  it('code가 2(POSITION_UNAVAILABLE)이면 { state: "error" }를 반환한다', () => {
    expect(toCurrentLocationError(errorOf(2))).toEqual({ state: 'error' });
  });

  it('code가 3(TIMEOUT)이면 { state: "timeout" }를 반환한다', () => {
    expect(toCurrentLocationError(errorOf(3))).toEqual({ state: 'timeout' });
  });

  it('알 수 없는 code(99)면 { state: "error" }를 반환한다', () => {
    expect(toCurrentLocationError(errorOf(99))).toEqual({ state: 'error' });
  });
});
