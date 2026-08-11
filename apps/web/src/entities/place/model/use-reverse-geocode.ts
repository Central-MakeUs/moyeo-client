'use client';

import * as React from 'react';

import { loadKakaoMapSdk, type Coord2AddressDocument } from '@/shared/lib/kakao-map-sdk';
import type { Coords } from '@/shared/ui/map-location-picker';

/** 카카오 역지오코딩의 성공 결과와 그때의 핀 좌표. */
export interface ReverseGeocodeResult {
  document: Coord2AddressDocument;
  coords: Coords;
}

export type ReverseGeocodeRequestStatus = 'idle' | 'resolving' | 'resolved' | 'failed';

/**
 * 역지오코딩 생명주기.
 *
 * 배타적 유니온이 아니라 레코드인 이유는, "이전 주소를 보여주면서 새 주소를 조회 중"과
 * "이전 주소를 보여주면서 새 좌표 조회는 실패"를 **동시에** 표현해야 하기 때문이다.
 * 조회가 시작될 때마다 결과를 버리면 지도를 움직일 때마다 주소가 사라진다.
 */
export interface ReverseGeocodeState {
  /** 마지막 성공 결과. 새 조회가 진행 중이거나 실패해도 유지한다. */
  lastResult: ReverseGeocodeResult | null;
  /** 가장 최근 주소 조회 요청의 생명주기. */
  requestStatus: ReverseGeocodeRequestStatus;
  /**
   * `lastResult`가 **현재 핀 좌표의 주소**라 확정할 수 있는가.
   *
   * 이동 중·조회 중·실패 중에는 `lastResult`가 남아 있어도 현재 핀의 주소가 아니므로 `false`다.
   * 슬라이스 5의 CTA 활성 조건이 사용한다.
   */
  canConfirmLocation: boolean;
}

export interface ReverseGeocode {
  state: ReverseGeocodeState;
  /** 지도 이동이 시작됐음을 알린다. 주소는 유지하고 확정만 막는다. */
  startMoving: () => void;
  /** 이동이 끝난 핀 좌표의 주소를 조회한다. 같은 좌표면 다시 부르지 않는다. */
  resolve: (coords: Coords) => void;
  /** 마지막으로 요청했던 핀 좌표의 주소를 다시 조회한다. */
  retry: () => void;
}

const areCoordsEqual = (a: Coords, b: Coords) =>
  a.latitude === b.latitude && a.longitude === b.longitude;

export function useReverseGeocode(): ReverseGeocode {
  const [lastResult, setLastResult] = React.useState<ReverseGeocodeResult | null>(null);
  const [requestStatus, setRequestStatus] = React.useState<ReverseGeocodeRequestStatus>('idle');
  const [isMoving, setIsMoving] = React.useState(false);

  /** 중복 조회 판정과 실패 후 재시도에 사용할 마지막 요청 좌표. */
  const lastRequestedCoordsRef = React.useRef<Coords | null>(null);

  /** 늦게 도착한 이전 응답이 최신 주소를 덮어쓰지 못하게 한다. */
  const requestIdRef = React.useRef(0);

  /** 화면을 닫은 뒤 도착한 SDK 응답으로 상태를 변경하지 않게 한다. */
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const requestAddress = React.useCallback((coords: Coords) => {
    lastRequestedCoordsRef.current = coords;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsMoving(false);
    setRequestStatus('resolving');

    const applyIfCurrent = (apply: () => void) => {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return;

      apply();
    };

    void loadKakaoMapSdk().then(
      function onSdkLoaded(maps) {
        const geocoder = new maps.services.Geocoder();

        // 두 좌표가 모두 number라 타입으로 순서 오류를 잡을 수 없다. 카카오는 경도가 먼저다.
        geocoder.coord2Address(coords.longitude, coords.latitude, (result, status) => {
          const document = result[0];

          applyIfCurrent(() => {
            if (status !== maps.services.Status.OK || document === undefined) {
              setRequestStatus('failed');
              return;
            }

            setLastResult({ document, coords });
            setRequestStatus('resolved');
          });
        });
      },
      function onSdkLoadFailed() {
        applyIfCurrent(() => {
          setRequestStatus('failed');
        });
      }
    );
  }, []);

  const resolve = React.useCallback(
    (coords: Coords) => {
      // 지도 생성 직후의 초기 `idle` 이나 중복 이벤트는 좌표가 같다.
      // 조회를 다시 걸지 않고 이동 상태만 해제한다 (§6-4).
      if (
        lastRequestedCoordsRef.current !== null &&
        areCoordsEqual(lastRequestedCoordsRef.current, coords)
      ) {
        setIsMoving(false);
        return;
      }

      requestAddress(coords);
    },
    [requestAddress]
  );

  const startMoving = React.useCallback(() => {
    setIsMoving(true);
  }, []);

  const retry = React.useCallback(() => {
    if (lastRequestedCoordsRef.current === null) return;

    requestAddress(lastRequestedCoordsRef.current);
  }, [requestAddress]);

  const state: ReverseGeocodeState = {
    lastResult,
    requestStatus,
    canConfirmLocation: lastResult !== null && !isMoving && requestStatus === 'resolved',
  };

  return { state, startMoving, resolve, retry };
}
