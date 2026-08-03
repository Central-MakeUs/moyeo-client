/**
 * 나가기가 부를 API를 확정해 둔 값(VIEW-01-F05).
 *
 * 로그인 참여자와 게스트는 엔드포인트도, 필요한 식별자도 다르다. 게스트에게는 계정이 없어
 * `meetingId` 대신 초대 코드와 닉네임으로 자기 참여를 지목한다.
 */
export type LeaveMeetingTarget =
  /** 로그인 참여자 — `DELETE /api/meetings/{meetingId}/participation`. */
  | { type: 'member'; meetingId: number }
  /** 게스트 — `DELETE /api/meetings/invitations/{inviteCode}/guests/{nickname}`. */
  | { type: 'guest'; inviteCode: string; nickname: string };
