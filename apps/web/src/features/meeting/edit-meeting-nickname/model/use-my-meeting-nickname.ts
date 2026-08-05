'use client';

import { useSession } from '@/entities/session';
import { useGetMeetingView } from '@/shared/api';

import { findMyMeetingNickname } from './find-my-meeting-nickname';

/**
 * 지금 이 모임에서 쓰고 있는 내 닉네임. 아직 모르면 `null`.
 *
 * 현황 조회는 화면이 이미 읽었으므로 같은 키로 캐시를 가져다 쓴다 — 추가 요청은 없다.
 */
export function useMyMeetingNickname(inviteCode: string): string | null {
  const session = useSession();
  const { data } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  const userId = session.status === 'authenticated' ? session.viewer.id : null;

  return findMyMeetingNickname(data?.participants, userId);
}
