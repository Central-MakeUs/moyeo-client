import type { ReverseGeocodingResponse } from '@/shared/api';
import type { Coords } from '@/shared/ui/map-location-picker';

import type { DepartureDraft } from './departure-draft';

/**
 * 서버 역지오코딩 결과와 사용자가 지정한 핀 좌표를 기존 출발지 모델인 `DepartureDraft`로 변환한다.
 * - 도로명 → 없으면 지번. 둘 다 없으면 확정 주소가 아니라 `null` 이다 (`spec-fixed.md` §6-2).
 * - `현재 위치` 같은 고정 문자열을 넣지 않는다.
 */
export function toDepartureDraft(
  details: ReverseGeocodingResponse,
  pinCoordinates: Coords
): DepartureDraft | null {
  const address = details.roadAddress ?? details.jibunAddress ?? null;

  if (address === null) return null;

  return {
    name: address,
    address,
    // 현재 좌표가 아니라 핀 좌표
    latitude: pinCoordinates.latitude,
    longitude: pinCoordinates.longitude,
  };
}
