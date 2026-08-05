import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

/** 게스트 신원 입력 다음에 모임 유형별 첫 참여 입력 경로를 반환합니다. */
export function getGuestJoinNextPath(
  inviteToken: string,
  planningType: MeetingInvitationResponsePlanningType
): string {
  if (planningType === 'PLACE_ONLY') {
    return `/i/${inviteToken}/respond/departure`;
  }

  return `/i/${inviteToken}/respond/schedule`;
}

/**
 * 일정 입력 다음 경로. 더 받을 입력이 없어 바로 제출해야 하면 `null`을 돌려준다.
 *
 * 경로를 돌려주는 함수가 "갈 곳 없음"을 말하는 자연스러운 방법이고, 호출부는 `null` 여부로
 * 제출과 이동을 가른다.
 */
export function getGuestScheduleNextPath(
  inviteToken: string,
  planningType: MeetingInvitationResponsePlanningType
): string | null {
  if (planningType === 'SCHEDULE_AND_PLACE') {
    return `/i/${inviteToken}/respond/departure`;
  }

  return null;
}
