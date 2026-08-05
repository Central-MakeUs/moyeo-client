'use client';

import { useGuestSession } from '@/entities/guest-session';
import { useSession } from '@/entities/session';

/**
 * - `member` / `guest` — 이 신원의 API로 읽고 쓴다
 * - `resolving` — 아직 판정 중. 어느 API도 부르면 안 된다
 * - `none` — 판정이 끝났고 참여자가 아니다. 수정할 응답이 없다
 */
export type ResponseOwnerKind = 'member' | 'guest' | 'resolving' | 'none';

export interface ResponseOwner {
  /** 내 응답을 어느 API로 읽고 쓸지. */
  kind: ResponseOwnerKind;
  /** 게스트일 때의 닉네임. 게스트 API 경로에 들어간다. */
  guestNickname: string | null;
}

/**
 * 내 응답을 회원 API로 다룰지 게스트 API로 다룰지 정한다.
 *
 * 로그인이 우선이다 — 같은 브라우저에 게스트 기록이 남아 있어도 로그인한 사람은 회원으로
 * 참여했다(`isViewerParticipant`와 같은 규칙).
 *
 * 두 출처 모두 첫 렌더에는 값이 없다. 세션은 조회 중이고 게스트 저장소는 localStorage라
 * 서버 렌더에서 읽을 수 없다. 그동안 `'resolving'`을 주는 이유는, 여기서 성급히 회원으로
 * 단정하면 **게스트에게 회원 API를 불러 401을 받기 때문이다.**
 */
export function useResponseOwner(inviteCode: string): ResponseOwner {
  const session = useSession();
  const { nickname, isRestored } = useGuestSession(inviteCode);

  if (session.status === 'authenticated') return { kind: 'member', guestNickname: null };
  if (session.status === 'loading' || !isRestored) {
    return { kind: 'resolving', guestNickname: null };
  }

  // 로그인도 게스트 기록도 없다. 이 모임의 참여자가 아니므로 수정할 응답이 없다.
  if (nickname === null) return { kind: 'none', guestNickname: null };

  return { kind: 'guest', guestNickname: nickname };
}
