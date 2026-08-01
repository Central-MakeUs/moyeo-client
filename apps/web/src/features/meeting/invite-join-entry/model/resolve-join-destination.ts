import type { SessionState } from '@/entities/session';
import type { ParticipationStatusResponseReason } from '@/shared/api';

/** 참여하기를 눌렀을 때 갈 곳. */
export type JoinDestination =
  /** 갈 수 없다. 버튼을 비활성으로 둔다. */
  | { type: 'blocked' }
  /** 로그인 수단을 먼저 고른다. Drawer 구성은 호출부가 정한다(prd.md ADR-5). */
  | { type: 'login-drawer' }
  /** 모임 닉네임 입력으로 이동한다. */
  | { type: 'nickname'; path: string }
  /** 이미 참여한 모임이다. 현황 화면으로 보낸다. */
  | { type: 'view'; path: string };

export interface ResolveJoinDestinationParams {
  /** 세션 상태. `useSession()`이 돌려주는 판별 필드만 쓴다. */
  sessionStatus: SessionState['status'];
  /** 서버가 계산한 참여 가능 여부(#146의 `ParticipationGuide.canJoin`). */
  canJoin: boolean;
  /** 경로의 초대 코드. */
  inviteCode: string;
  /** 서버가 준 참여 불가 사유. `ALREADY_JOINED`면 현황 화면으로 보낸다. */
  reason?: ParticipationStatusResponseReason;
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
  reason,
}: ResolveJoinDestinationParams): JoinDestination {
  // loading·error는 어디로 보낼지 판단할 근거가 없다.
  if (sessionStatus === 'loading' || sessionStatus === 'error') return { type: 'blocked' };

  // canJoin보다 먼저 본다. 서버는 이미 참여한 경우 canJoin: false를 함께 주는데, 그걸 먼저
  // 보면 "참여 불가"로 막혀 현황으로 갈 길이 사라진다. 이미 참여했다는 건 참여할 수 없다가
  // 아니라 다른 곳으로 가야 한다는 뜻이다.
  //
  // 현황 화면(#135)은 모임 ID가 아니라 초대 코드로 조회한다. 화면 경로도 그에 맞춘다.
  if (sessionStatus === 'authenticated' && reason === 'ALREADY_JOINED')
    return { type: 'view', path: `/meetings?code=${inviteCode}` };

  // 참여 불가 모임은 로그인해도 들어가지 못한다.
  if (!canJoin) return { type: 'blocked' };

  if (sessionStatus === 'anonymous') return { type: 'login-drawer' };

  return { type: 'nickname', path: `/i/${inviteCode}/nickname` };
}
