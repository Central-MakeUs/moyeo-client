import type { CurrentLocationResult } from '@repo/types';

/** 성공 응답 정규화. `accuracy` 는 브라우저가 주지 않을 수 있어 `null` 을 허용한다. */
export function toCurrentLocationResult(position: GeolocationPosition): CurrentLocationResult {
  const { latitude, longitude, accuracy } = position.coords;

  return { state: 'success', coords: { latitude, longitude, accuracy: accuracy ?? null } };
}

/**
 * 실패 응답 정규화 (`spec-fixed.md` §5-2).
 *
 * `blocked` · `servicesDisabled` 는 브라우저가 만들지 않는다 — 네이티브 브리지(2차)만 생성한다.
 * 표에 없는 코드는 `error` 로 떨어뜨린다. 새 코드가 생겨도 화면이 비지 않게 하기 위해서다.
 */
export function toCurrentLocationError(error: GeolocationPositionError): CurrentLocationResult {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return { state: 'denied' };
    case 3: // TIMEOUT
      return { state: 'timeout' };
    default: // POSITION_UNAVAILABLE(2) 및 알 수 없는 코드
      return { state: 'error' };
  }
}
