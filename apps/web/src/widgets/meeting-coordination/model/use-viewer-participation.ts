'use client';

import { isViewerParticipant } from '@/entities/participant';
import { useGetMeetingView } from '@/shared/api';

import { useViewerIdentity } from './use-viewer-identity';

/**
 * 보고 있는 사람이 이 모임에 참여했는지.
 *
 * 현황 화면은 초대 코드만 있으면 열리는 공개 화면이라, 참여하지 않은 사람도 남의 모임을
 * 들여다볼 수 있다. 그 사람에게는 고칠 응답이 없다 — 수정 화면에 들어가 봐야 서버가
 * 404(`MEETING_PARTICIPANT_NOT_FOUND`)로 거절한다.
 *
 * 현황 조회는 화면이 이미 읽었으므로 같은 키로 캐시를 쓴다 — 추가 요청은 없다.
 */
export function useIsViewerParticipant(inviteCode: string): boolean {
  const viewer = useViewerIdentity(inviteCode);
  const { data } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  return (data?.participants ?? []).some((participant) =>
    isViewerParticipant(
      { userId: participant.userId ?? null, nickname: participant.nickname ?? '' },
      viewer
    )
  );
}
