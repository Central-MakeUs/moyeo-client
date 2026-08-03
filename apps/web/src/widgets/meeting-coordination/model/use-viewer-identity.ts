'use client';

import { useGuestSession } from '@/entities/guest-session';
import type { ViewerIdentity } from '@/entities/participant';
import { useSession } from '@/entities/session';

/**
 * 지금 화면을 보고 있는 사람의 신원을 모은다. 참여자 목록에서 "나"를 가려낼 때 쓴다.
 *
 * 로그인 계정과 게스트 저장소는 서로 다른 곳에 있어 여기서 합친다. 어느 쪽을 우선하는지는
 * `isViewerParticipant`가 정한다 — 판단 규칙을 훅이 아니라 순수 함수 한 곳에 둔다.
 *
 * 두 출처 모두 entities라 같은 레이어끼리 참조하지 않도록 조립은 위젯에서 한다.
 */
export function useViewerIdentity(inviteCode: string): ViewerIdentity {
  const session = useSession();
  const { nickname } = useGuestSession(inviteCode);

  return {
    userId: session.status === 'authenticated' ? session.viewer.id : null,
    guestNickname: nickname,
  };
}
