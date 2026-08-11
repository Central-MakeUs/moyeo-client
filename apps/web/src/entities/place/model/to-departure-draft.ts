import type { Coord2AddressDocument } from '@/shared/lib/kakao-map-sdk';
import type { Coords } from '@/shared/ui/map-location-picker';

import type { DepartureDraft } from './departure-draft';

/**
 * 카카오 역지오코딩 결과와 사용자가 지정한 핀 좌표를 기존 출발지 모델인 `DepartureDraft`로 변환하는 함수
 * - 역지오코딩 결과를 출발지로 옮긴다 (`spec-fixed.md` §6-2).
 * - 도로명 → 없으면 지번. 둘 다 없으면 확정 주소가 아니라 `null` 이다.
 * - `현재 위치` 같은 고정 문자열을 넣지 않는다.
 */
export function toDepartureDraft(
  document: Coord2AddressDocument,
  pinCoordinates: Coords
): DepartureDraft | null {
  const address = document.road_address?.address_name ?? document.address?.address_name ?? null;

  if (address === null) return null;

  return {
    name: address,
    address,
    // 현재 좌표가 아니라 핀 좌표
    latitude: pinCoordinates.latitude,
    longitude: pinCoordinates.longitude,
  };
}
