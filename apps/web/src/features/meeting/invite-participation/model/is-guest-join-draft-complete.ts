import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

import type { GuestJoinDraftInput } from './guest-join-draft';

/**
 * 이 모임 유형에 필요한 입력이 모두 채워졌는지 판단한다. 각 화면의 CTA `disabled`가 쓴다.
 *
 * `scheduleInputType`은 받지 않는다. `DATE_ONLY`는 `availableDates`, `DATE_AND_TIME`은
 * `availableTimeRanges`를 채우는데 한 화면이 둘 중 하나만 쓰므로, 둘 중 하나라도 비어있지
 * 않으면 채워진 것으로 본다.
 *
 * `identity`는 보지 않는다. 신원 유효성은 `isDraftUsableFor`가 담당한다.
 */
export function isGuestJoinDraftComplete(
  input: GuestJoinDraftInput,
  planningType: MeetingInvitationResponsePlanningType
): boolean {
  const { scheduleResponse, departure, transportationMode } = input;

  const hasSchedule =
    (scheduleResponse?.availableDates?.length ?? 0) > 0 ||
    (scheduleResponse?.availableTimeRanges?.length ?? 0) > 0;

  // 이동수단은 DepartureRequest의 필수 필드라 출발지만으로는 보낼 수 없다.
  const hasDeparture = departure !== null && transportationMode !== null;

  if (planningType === 'PLACE_ONLY') return hasDeparture;
  if (planningType === 'SCHEDULE_AND_PLACE') return hasSchedule && hasDeparture;

  return hasSchedule;
}
