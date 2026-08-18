'use client';

import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import {
  reverseGeocode,
  type ReverseGeocodeParams,
  type ReverseGeocodingResponse,
} from '@/shared/api';
import type { Coords } from '@/shared/ui/map-location-picker';

/** 캐시 보유 시간
 * - 주소 결과 query가 사용 중이 아니어도 10분 간 캐시에 보관
 */
const PIN_ADDRESS_GC_TIME = 10 * 60 * 1000;

/** 좌표 비교 함수
 * - 같은 핀 좌표로 중복 조회하지 않기 위해 사용
 * - 마지막 성공 주소와 현재 핀 좌표의 주소가 동일한지 확인하기 위해 사용
 */
const areCoordsEqual = (a: Coords, b: Coords) =>
  a.latitude === b.latitude && a.longitude === b.longitude;

/**
 * 서버에서 준 응답에 좌표가 없으므로, 서버 응답과 요청 좌표를 하나의 객체로 묶음
 */
export interface PinAddressResult {
  /** 서버가 정규화한 주소와 지원 지역 판정 결과. */
  details: ReverseGeocodingResponse;
  /** 이 응답을 조회할 때 사용한 핀 좌표. */
  coords: Coords;
}

/** 좌표를 통한 주소 요청의 상태 */
export type PinAddressRequestStatus = 'idle' | 'resolving' | 'resolved' | 'failed';

export interface PinAddressState {
  /** 마지막 **성공** 결과. 이동 중·새 요청 중·실패 중에도 유지한다. */
  lastResult: PinAddressResult | null;
  requestStatus: PinAddressRequestStatus;
  /** 이동 중이 아니고 **현재 핀 좌표의 요청이 실제로 성공**했을 때만 true. */
  canConfirmLocation: boolean;
}

/**
 * 훅 외부로 공개하는 기능
 * - `state`: 주소 조회 결과와 상태
 * - `startMoving`: 지도 이동이 시작됐다고 알림
 * - `requestAddress`: 이동이 끝난 좌표의 주소 조회
 * - `retry`: 현재 좌표 재조회
 */
export interface PinAddress {
  state: PinAddressState;
  /** 지도 이동이 시작됐음을 알린다. 주소는 유지하고 확정만 막는다. */
  startMoving: () => void;
  /** 이동이 끝난 핀 좌표의 주소를 조회한다. 같은 좌표면 다시 부르지 않는다. */
  requestAddress: (coords: Coords) => void;
  /** 마지막으로 요청했던 핀 좌표의 주소를 다시 조회한다. */
  retry: () => void;
}

/**
 * 지도 중앙의 핀 좌표를 서버에 보내 **주소를 조회**하고, 화면에 보여줄 마지막 주소와 현재 확정 가능 여부를 관리하는 훅
 * - 회원은 API client의 `Access Token`을 사용한다.
 * - 비회원은 `inviteCode`로 요청 권한을 증명한다.
 */
export function usePinAddress(inviteCode?: string): PinAddress {
  const [pinCoords, setPinCoords] = React.useState<Coords | null>(null); // 현재 주소를 조회해야 하는 핀 좌표
  const [isMoving, setIsMoving] = React.useState(false); // 지도가 현재 움직이는지

  /**
   * 마지막 성공한 주소와 좌표
   * -  현재 query가 새 좌표를 조회 중이거나 새 요청에 실패해도 이 값은 유지한다.
   */
  const [lastResult, setLastResult] = React.useState<PinAddressResult | null>(null);

  /**
   * API 파라미터 생성
   * - `query key`·`queryFn`·`enabled`를 모두 결정한다
   * - 게스트/회원의 형태가 다르다
   */
  const params: ReverseGeocodeParams | null =
    pinCoords === null
      ? null
      : {
          latitude: pinCoords.latitude,
          longitude: pinCoords.longitude,
          ...(inviteCode === undefined ? {} : { inviteCode }),
        };

  const query = useQuery({
    queryKey: ['departure-place-reverse-geocode', params],

    /**
     * - pinCoords 변경 → params 생성 → query key 변경 → queryFn가 실행된다.
     */
    queryFn: async ({ signal }): Promise<PinAddressResult> => {
      // enabled는 타입을 좁혀주지 않는다. 계약을 런타임으로도 고정한다.
      if (params === null) throw new Error('핀 좌표 없이 주소를 조회하지 않는다');

      const details = await reverseGeocode(params, undefined, signal);

      return { details, coords: { latitude: params.latitude, longitude: params.longitude } };
    },

    enabled: params !== null, // 핀 좌표가 있을 때만 요청
    staleTime: Infinity, // 캐시에 있는 같은 좌표의 주소는 오래됐다고 판단하지 않는다
    gcTime: PIN_ADDRESS_GC_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // 4xx(인증 실패·잘못된 요청)는 재시도해도 결과가 같다. 5xx·네트워크만 1회.
      if (isAxiosError(error) && error.response?.status) {
        return error.response.status >= 500 && failureCount < 1;
      }

      return failureCount < 1;
    },
  });

  const { data, isSuccess, isError, isFetching } = query;

  React.useEffect(() => {
    if (!isSuccess || data === undefined) return;

    setLastResult(data);
  }, [isSuccess, data]);

  /** `idle` 은 아직 조회할 핀 좌표가 없는 상태로만 한정한다. */
  let requestStatus: PinAddressRequestStatus;

  if (params === null) requestStatus = 'idle';
  else if (isFetching) requestStatus = 'resolving';
  else if (isError) requestStatus = 'failed';
  else if (isSuccess) requestStatus = 'resolved';
  else requestStatus = 'resolving';

  /**
   * 좌표 일치까지 확인하는 이유: query 성공 렌더와 effect의 `lastResult` 갱신 사이에는
   * 한 렌더 간극이 있다. 이 조건이 없으면 그 순간 직전 핀의 주소로 CTA가 활성화된다.
   */
  const canConfirmLocation =
    !isMoving &&
    requestStatus === 'resolved' &&
    pinCoords !== null &&
    lastResult !== null &&
    areCoordsEqual(lastResult.coords, pinCoords);

  const startMoving = React.useCallback(() => {
    setIsMoving(true);
  }, []);

  /**
   * 지도 이동이 끝난 핀 좌표를 저장하고 해당 좌표의 주소 조회를 시작한다.
   */
  const requestAddress = React.useCallback((coords: Coords) => {
    setIsMoving(false);

    // 지도 생성 직후의 초기 `idle` 이나 중복 이벤트는 좌표가 같다. 재조회를 걸지 않는다 (§6-4).
    setPinCoords((currentCoords) =>
      currentCoords !== null && areCoordsEqual(currentCoords, coords) ? currentCoords : coords
    );
  }, []);

  const retry = () => {
    if (params === null) return;

    void query.refetch();
  };

  return {
    state: { lastResult, requestStatus, canConfirmLocation },
    startMoving,
    requestAddress,
    retry,
  };
}
