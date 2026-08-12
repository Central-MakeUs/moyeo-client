import { availabilityTimeRangesToCellKeys } from '@/entities/meeting';
import type { EditDepartureDraftSeed } from '@/features/meeting/edit-response';
import type { ScheduleAvailabilityRequest } from '@/shared/api';

/**
 * 지금 화면 값이 서버에 저장된 응답과 같은지 본다. 같으면 "수정 완료"를 누를 이유가 없다.
 *
 * 골랐다가 다시 풀어 원래대로 돌아온 경우도 "같음"으로 본다. 손을 댔는지가 아니라
 * **보낼 것이 있는지**가 기준이다.
 */

/** 순서·중복을 무시하고 같은 값들인지. 고른 순서는 응답의 일부가 아니다. */
function hasSameValues(left: string[], right: string[]): boolean {
  const a = new Set(left);
  const b = new Set(right);

  return a.size === b.size && [...a].every((value) => b.has(value));
}

/** `DATE_ONLY` 모임의 날짜 응답. */
export function isSameDates(original: string[], current: string[]): boolean {
  return hasSameValues(original, current);
}

/**
 * `DATE_AND_TIME` 모임의 시간 응답.
 *
 * 구간을 그대로 비교하지 않고 셀 키로 펼쳐서 본다. 서버가 `10:00~12:00` 한 덩어리로 준 것을
 * 화면이 `10:00~11:00`+`11:00~12:00`으로 쪼개 들고 있어도 고른 시간대는 같기 때문이다.
 */
export function isSameTimeRanges(
  original: ScheduleAvailabilityRequest[],
  current: ScheduleAvailabilityRequest[]
): boolean {
  return hasSameValues(
    availabilityTimeRangesToCellKeys(original),
    availabilityTimeRangesToCellKeys(current)
  );
}

/** 출발지·이동수단 응답. 양쪽 다 `toDepartureSeed`를 거친 형태로 받는다. */
export function isSameDeparture(
  original: EditDepartureDraftSeed,
  current: EditDepartureDraftSeed
): boolean {
  if (original.transportationMode !== current.transportationMode) return false;

  const a = original.departure;
  const b = current.departure;

  // 한쪽만 비어 있으면 다른 응답이다. 둘 다 비었으면 같다.
  if (a === null || b === null) return a === b;

  return (
    a.name === b.name &&
    a.address === b.address &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude
  );
}
