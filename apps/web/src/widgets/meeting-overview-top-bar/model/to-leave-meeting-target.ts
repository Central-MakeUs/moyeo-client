import type { LeaveMeetingTarget } from '@/features/meeting/leave-meeting';

import type { MeetingViewerRole } from './meeting-viewer-role';

export interface ToLeaveMeetingTargetParams {
  /** 보고 있는 사람의 역할. 아직 판별 전이면 `null`. */
  role: MeetingViewerRole | null;
  /** 현황 조회로 받은 모임 ID. 아직 응답 전이면 `undefined`. */
  meetingId?: number;
  inviteCode: string;
  /** 저장된 게스트 닉네임. 게스트가 아니면 `null`. */
  guestNickname: string | null;
}

/**
 * 역할과 지금 손에 든 식별자로 나가기가 부를 API를 정한다.
 *
 * 모임장은 나가기가 아니라 삭제이므로 `null`이다. 필요한 식별자가 아직 없을 때도 `null`이다
 * — 회원은 `meetingId`가, 게스트는 닉네임이 있어야 요청을 만들 수 있다. 호출부는 `null`인
 * 동안 확인 팝업을 열지 않는다. 확인까지 받고 나서 "보낼 수 없다"고 알리는 것보다 낫다.
 */
export function toLeaveMeetingTarget({
  role,
  meetingId,
  inviteCode,
  guestNickname,
}: ToLeaveMeetingTargetParams): LeaveMeetingTarget | null {
  switch (role) {
    case 'member':
      return meetingId === undefined ? null : { type: 'member', meetingId };
    case 'guest':
      return guestNickname === null ? null : { type: 'guest', inviteCode, nickname: guestNickname };
    default:
      return null;
  }
}
