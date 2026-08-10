'use client';

import * as React from 'react';

import type { CurrentLocationResult } from '@repo/types';

import { toCurrentLocationError, toCurrentLocationResult } from './to-current-location-result';

/**
 * 캐시된 위치를 사용하지 않고 고정밀 좌표를 한 번 요청한다.
 * 연속 추적이 아니므로 `watchPosition`은 사용하지 않는다.
 */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

export interface CurrentLocation {
  /** 요청이 끝나기 전에는 `null` (= 좌표 요청 중). */
  result: CurrentLocationResult | null;
  /** 좌표를 다시 요청한다. 진행 중이면 무시한다. */
  retry: () => void;
}

export function useCurrentLocation(): CurrentLocation {
  const [result, setResult] = React.useState<CurrentLocationResult | null>(null);

  // 진행 중에는 재요청을 막아 권한 요청이 겹치지 않게 한다.
  const isRequestingRef = React.useRef(false);

  const request = React.useCallback(() => {
    if (isRequestingRef.current) return;

    // Geolocation API를 사용할 수 없는 환경은 일반 오류로 처리한다.
    if (navigator.geolocation === undefined) {
      setResult({ state: 'error' });
      return;
    }

    isRequestingRef.current = true;
    setResult(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        isRequestingRef.current = false;
        setResult(toCurrentLocationResult(position));
      },
      (error) => {
        isRequestingRef.current = false;
        setResult(toCurrentLocationError(error));
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  React.useEffect(() => {
    request();
  }, [request]);

  return { result, retry: request };
}
