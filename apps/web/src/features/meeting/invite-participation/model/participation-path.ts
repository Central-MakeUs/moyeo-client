import type { ParticipantKind } from './participation-identity';

/** 참여자 종류에 따른 최초 정보 입력 경로. */
export function participationEntryPath(
  inviteToken: string,
  participantKind: ParticipantKind
): string {
  return participantKind === 'member' ? `/i/${inviteToken}/nickname` : `/i/${inviteToken}/guest`;
}

/** 참여 제출 완료 경로. */
export function participationCompletePath(inviteToken: string): string {
  return `/i/${inviteToken}/complete`;
}

/** 초대장 최초 진입 경로. */
export function invitationPath(inviteToken: string): string {
  return `/i/${inviteToken}`;
}

/**
 * 모임 현황 경로. 아직 확정 전인 모임의 참여자가 자기 응답과 진행 상황을 보는 곳이다.
 * 모임 ID가 아니라 초대 코드로 조회하므로 경로도 코드를 싣는다.
 */
export function meetingOverviewPath(inviteToken: string): string {
  return `/meetings?code=${inviteToken}`;
}

/** 확정된 모임의 결과 화면 경로. */
export function meetingConfirmedPath(inviteToken: string): string {
  return `/meetings/confirmed?code=${inviteToken}`;
}
