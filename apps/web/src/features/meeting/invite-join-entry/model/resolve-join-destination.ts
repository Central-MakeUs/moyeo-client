import type { SessionState } from '@/entities/session';
import type { ParticipationStatusResponseReason } from '@/shared/api';

/** 참여하기를 눌렀을 때 갈 곳. */
export type JoinDestination =
  /** 세션을 읽는 중이라 아직 어디로 갈지 모르는 경우 */
  | { type: 'pending' }
  /** 세션을 읽지 못한 경우 - 참여 불가가 아닌 재시도 대상 */
  | { type: 'session-error' }
  /** 참여 불가능 */
  | { type: 'blocked' }
  | { type: 'login-drawer' }
  | { type: 'nickname'; path: string }
  /** 이미 참여한 사용자 */
  | { type: 'joined'; path: string };

/**
 * 세션을 몰라 아직 판정할 수 없는 목적지인지.
 *
 * 참여 불가(`blocked`)와 구분한다 — 이쪽은 안내할 사유가 없고, 기다리거나 재시도할 대상이다.
 */
export function isSessionUnresolved(
  destination: JoinDestination
): destination is Extract<JoinDestination, { type: 'pending' | 'session-error' }> {
  return destination.type === 'pending' || destination.type === 'session-error';
}

/**
 * 참여 정보를 입력하러 가는 경로.
 *
 * 진입 조회가 막혔다고 답해도 토큰 실은 재확인이 뒤집을 수 있어, 재확인의 기본 경로로도 쓴다.
 */
export function joinEntryPath(inviteCode: string): string {
  return `/i/${inviteCode}/nickname`;
}

export interface ResolveJoinDestinationParams {
  sessionStatus: SessionState['status'];
  canJoin: boolean;
  inviteCode: string;
  reason?: ParticipationStatusResponseReason;
}

export function resolveJoinDestination({
  sessionStatus,
  canJoin,
  inviteCode,
  reason,
}: ResolveJoinDestinationParams): JoinDestination {
  // 세션을 모르면 참여 불가가 아니라 "아직 판정할 수 없음"이다. 둘을 blocked로 뭉치면
  // 호출부가 다시 session.status를 보고 풀어야 해서, 판정이 두 곳에 생긴다.
  if (sessionStatus === 'loading') return { type: 'pending' };
  if (sessionStatus === 'error') return { type: 'session-error' };

  // 이미 참여한 모임인 경우 현황 페이지로 이동
  if (sessionStatus === 'authenticated' && reason === 'ALREADY_JOINED')
    return { type: 'joined', path: `/meetings?code=${inviteCode}` };

  // 익명이면 참여 가능 여부와 무관하게 로그인 drawer 오픈
  if (sessionStatus === 'anonymous') return { type: 'login-drawer' };

  // 로그인한 사용자
  if (!canJoin) return { type: 'blocked' };

  // 로그인 했으나 모임에 참여하지는 않은 사용자
  return { type: 'nickname', path: joinEntryPath(inviteCode) };
}
