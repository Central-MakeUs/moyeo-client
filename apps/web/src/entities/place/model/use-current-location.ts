'use client';

import * as React from 'react';

import type { CurrentLocationResult } from '@repo/types';

import { toCurrentLocationError, toCurrentLocationResult } from './to-current-location-result';

/**
 * 고정밀 좌표를 한 번 요청한다. 연속 추적이 아니므로 `watchPosition`은 사용하지 않는다.
 *
 * `maximumAge` 는 3분이다. picker는 닫으면 언마운트되므로 검색 화면을 오갈 때마다 좌표를
 * 새로 요청하는데, 고정밀 측정은 실내에서 수 초가 걸린다. 3분 이내면 브라우저가 방금 잡아둔
 * 좌표를 재사용할 수 있다. 오래되거나 정확도가 낮은 좌표는 사용자가 지도를 움직여 교정한다.
 */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 180_000,
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
