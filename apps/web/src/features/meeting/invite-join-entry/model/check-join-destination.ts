import { isAxiosError } from 'axios';

import { isExplainedBlockReason } from '@/entities/meeting';
import { getInvitation, type ParticipationStatusResponse } from '@/shared/api';

import { resolveJoinDestination } from './resolve-join-destination';

/**
 * 참여하기를 탭한 뒤, 서버에 다시 물어보고 내린 결론.
 *
 * `JoinDestination`이 "화면에 있는 정보만으로 정한 방향"이라면 이쪽은 "확인까지 마친 결론"이다.
 * 방향이 `nickname`이든 `joined`든 호출부가 할 일은 경로로 이동하는 것뿐이라 `move` 하나로
 * 합친다 — 어디로 가는지는 `path`가 이미 말한다.
 */
export type CheckedJoinDestination =
  /** 이동해도 된다. */
  | { type: 'move'; path: string }
  /** 그새 마감되거나 정원이 찼다. 사유를 화면이 안내한다. */
  | { type: 'blocked'; status: ParticipationStatusResponse }
  /** 모임이 사라졌다. 참여할 대상 자체가 없다. */
  | { type: 'not-found' };

/**
 * 이미 참여한 사용자가 갈 곳.
 *
 * 확정된 모임이면 결과 화면, 아직 조율 중이면 현황 화면이다. 게스트 진입과 같은 판단
 * (`invite-participation`의 `getGuestEntryNextPath`).
 */
function joinedPath(inviteCode: string, isConfirmed: boolean): string {
  return isConfirmed ? `/meetings/confirmed?code=${inviteCode}` : `/meetings?code=${inviteCode}`;
}

/**
 * 로그인한 사용자의 실제 목적지를 확인한다.
 *
 * 진입 조회는 서버 컴포넌트의 네이티브 fetch라 토큰이 없어 `ALREADY_JOINED`를 담을 수 없다.
 * 토큰이 실리는 클라이언트 조회로 한 번 더 확인한다
 *
 * 조회에 실패하면 `fallbackPath`로 보낸다. 확인은 편의일 뿐이고 최종 방어선은 서버의 참여
 * 제출 거절이다. 확인이 안 된다고 참여 자체를 막지 않는다.
 *
 * 단 404는 예외다. 삭제된 모임은 재시도로 살아나지 않는데, 이때 `fallbackPath`로 보내면
 * 그 화면의 가드가 다시 초대 화면으로 되돌려 보내 제자리를 도는 것처럼 보인다.
 */
export async function checkJoinDestination(
  inviteCode: string,
  fallbackPath: string
): Promise<CheckedJoinDestination> {
  try {
    const invitation = await getInvitation(inviteCode);
    const status = invitation.participationStatus;

    // 상태가 없는 성공 응답도 참여 여부를 확인하지 못한 경우다. 네트워크 실패와 동일하게
    // 기존 경로로 진행하고, 최종 참여 가능 여부는 참여 제출 API가 판단한다.
    if (!status) return { type: 'move', path: fallbackPath };

    const destination = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: status.canJoin === true,
      inviteCode,
      reason: status.reason,
    });

    // 설명할 수 없는 사유(예: MEETING_CONFIRMED)로 안내를 띄우면 막혔다는 뜻이 전달되지 않는다.
    // 그때는 원래 경로로 진행하고 참여 제출 API가 최종 판단하게 둔다.
    if (destination.type === 'blocked') {
      return isExplainedBlockReason(status.reason)
        ? { type: 'blocked', status }
        : { type: 'move', path: fallbackPath };
    }

    // 이미 참여한 사용자다. `resolveJoinDestination`은 확정 여부를 모르므로 그 경로를 쓰지 않고,
    // 방금 받은 응답으로 결과 화면·현황 화면을 가른다.
    if (destination.type === 'joined') {
      return { type: 'move', path: joinedPath(inviteCode, invitation.status === 'CONFIRMED') };
    }

    return { type: 'move', path: fallbackPath };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return { type: 'not-found' };

    return { type: 'move', path: fallbackPath };
  }
}
