export type ParticipantKind = 'guest' | 'member';

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
