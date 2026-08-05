'use client';

import { isViewerParticipant } from '@/entities/participant';
import { useGetMeetingView } from '@/shared/api';

import { useViewerIdentity } from './use-viewer-identity';

export interface MeetingHost {
  /** 모임장의 참여자 ID. 아직 모르면 `null`. */
  participantId: number | null;
  /** 보고 있는 사람이 이 모임의 모임장인지. */
  isViewerHost: boolean;
}

/**
 * 이 모임의 모임장이 누구인지, 그게 나인지 알아낸다.
 *
 * 일정 조율 응답(`availableParticipants`)에는 참여자 유형이 없어 "모임장" 뱃지를 붙일 수
 * 없다. 현황 조회에는 있으므로 거기서 모임장의 참여자 ID를 가져와 대조한다. 현황은 화면이
 * 이미 읽었으므로 같은 키로 캐시를 쓴다 — 추가 요청은 없다.
 */
export function useMeetingHost(inviteCode: string): MeetingHost {
  const viewer = useViewerIdentity(inviteCode);
  const { data } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  const host = data?.participants?.find((participant) => participant.participantType === 'HOST');

  if (!host) return { participantId: null, isViewerHost: false };

  return {
    participantId: host.participantId ?? null,
    isViewerHost: isViewerParticipant(
      { userId: host.userId ?? null, nickname: host.nickname ?? '' },
      viewer
    ),
  };
}
