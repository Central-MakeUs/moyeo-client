import type { ScheduleResponseRequest } from '@/shared/api';

/**
 * 후보 날짜에 없는 선택을 걷어낸다.
 *
 * 후보 날짜는 모임장이 정하고 참여자는 바꿀 수 없다. 참여자가 고른 뒤 모임장이 후보를 줄이면
 * 남은 선택이 서버 제출에서 거절되므로, 후보를 받는 시점에 즉시 정리한다(prd.md ADR-4).
 */
export function pruneScheduleResponse(
  response: ScheduleResponseRequest | null,
  candidateDates: string[]
): ScheduleResponseRequest | null {
  if (response === null) return null;

  const isCandidate = (date: string) => candidateDates.includes(date);

  return { availableDates: (response.availableDates ?? []).filter(isCandidate) };
}
