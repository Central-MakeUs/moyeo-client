import type {
  GuestEntryResponseEntryType,
  MeetingInvitationResponsePlanningType,
} from '@/shared/api';

import { getGuestJoinNextPath } from './guest-join-next-path';
import { meetingConfirmedPath, meetingOverviewPath } from './participation-path';

/**
 * 진입 분기 결과에 따라 다음 경로를 반환한다.
 *
 * `EXISTING_GUEST`는 이미 제출을 마친 참여자라 `planningType`과 무관하게 모임을 보러 간다.
 * 확정된 모임이면 결과 화면으로, 아직 조율 중이면 현황 화면으로 보낸다.
 * 참여 제출은 마지막에 한 번이므로 입력 도중 이탈한 사람은 `NEW_GUEST`로 온다.
 */
export function getGuestEntryNextPath(
  inviteToken: string,
  planningType: MeetingInvitationResponsePlanningType,
  entryType: GuestEntryResponseEntryType,
  isConfirmed: boolean
): string {
  if (entryType === 'EXISTING_GUEST') {
    return isConfirmed ? meetingConfirmedPath(inviteToken) : meetingOverviewPath(inviteToken);
  }

  return getGuestJoinNextPath(inviteToken, planningType);
}
