import type { ScheduleResponseRequest } from '@/shared/api';

/** 모임장이 정한 조율 범위. 이 밖으로 나간 응답은 남겨둘 수 없다. */
export interface HostScheduleBounds {
  /** 후보 날짜. 'yyyy-MM-dd' */
  candidateDates: string[];
  /** 공통 시간 범위 시작. 'HH:mm'. 시간 조율을 하지 않으면 null. */
  availableStartTime: string | null;
  /** 공통 시간 범위 종료. 'HH:mm'. 시간 조율을 하지 않으면 null. */
  availableEndTime: string | null;
}

/**
 * 조율 범위 밖으로 나간 모임장 본인의 응답을 걷어낸다.
 *
 * 참여자 쪽 `pruneScheduleResponse`와 달리 **시간 경계까지 본다.** 참여자에게 후보 날짜와
 * 시간 범위는 서버가 준 불변값이지만, 모임장은 위저드를 되돌아가 둘 다 바꿀 수 있다.
 */
export function pruneHostScheduleResponse(
  response: ScheduleResponseRequest | null,
  bounds: HostScheduleBounds
): ScheduleResponseRequest | null {
  throw new Error(`not implemented (${typeof response}, ${typeof bounds})`);
}
