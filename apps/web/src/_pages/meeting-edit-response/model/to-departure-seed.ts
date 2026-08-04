import type { EditDepartureDraftSeed } from '@/features/meeting/edit-response';
import type { Departure } from '@/shared/api';

/**
 * 조회 응답의 출발지를 편집 초안이 쓰는 형태로 바꾼다.
 *
 * 조회 스키마는 모든 필드가 optional이고 표시명이 `null`일 수 있다. 이름을 입력하지 않고
 * 참여한 경우인데, 화면에는 빈 칸 대신 주소를 보여준다. 주소마저 없으면 고른 출발지로 볼 수
 * 없으므로 초안을 비운 채로 연다 — 사용자는 다시 검색해서 고르게 된다.
 */
export function toDepartureSeed(departure: Departure | null): EditDepartureDraftSeed {
  const address = departure?.address;

  return {
    departure:
      departure && address
        ? {
            name: departure.name ?? address,
            address,
            latitude: departure.latitude ?? undefined,
            longitude: departure.longitude ?? undefined,
          }
        : null,
    transportationMode: departure?.transportationMode ?? null,
  };
}
