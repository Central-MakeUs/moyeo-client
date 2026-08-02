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
