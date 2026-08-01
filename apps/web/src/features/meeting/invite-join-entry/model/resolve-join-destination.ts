import type { SessionState } from '@/entities/session';

/** 참여하기를 눌렀을 때 갈 곳. */
export type JoinDestination =
  /** 갈 수 없다. 버튼을 비활성으로 둔다. */
  | { type: 'blocked' }
  /** 로그인 수단을 먼저 고른다. Drawer 구성은 호출부가 정한다(prd.md ADR-5). */
  | { type: 'login-drawer' }
  /** 모임 닉네임 입력으로 이동한다. */
  | { type: 'nickname'; path: string };

export interface ResolveJoinDestinationParams {
  /** 세션 상태. `useSession()`이 돌려주는 판별 필드만 쓴다. */
  sessionStatus: SessionState['status'];
  /** 서버가 계산한 참여 가능 여부(#146의 `ParticipationGuide.canJoin`). */
  canJoin: boolean;
  /** 경로의 초대 코드. */
  inviteCode: string;
}

/**
 * 참여하기를 눌렀을 때의 목적지를 정한다.
 *
 * 활성 조건은 `canJoin=true` **AND** `sessionStatus ∈ {anonymous, authenticated}`다
 * (`spec-fixed.md` §4-3). `canJoin`을 먼저 보므로 로그인해도 참여 불가 모임에는 못 들어간다.
 */
export function resolveJoinDestination({
  sessionStatus,
  canJoin,
  inviteCode,
}: ResolveJoinDestinationParams): JoinDestination {
  // 참여 불가 모임은 로그인해도 들어가지 못한다.
  if (!canJoin) return { type: 'blocked' };

  if (sessionStatus === 'anonymous') return { type: 'login-drawer' };
  if (sessionStatus === 'authenticated') {
    return { type: 'nickname', path: `/i/${inviteCode}/nickname` };
  }

  // loading·error는 어디로 보낼지 판단할 근거가 없다.
  return { type: 'blocked' };
}
