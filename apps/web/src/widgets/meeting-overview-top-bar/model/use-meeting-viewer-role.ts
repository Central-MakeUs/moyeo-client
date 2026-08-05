'use client';

import type { AxiosError } from 'axios';

import { useGuestSession } from '@/entities/guest-session';
import { useSession } from '@/entities/session';
import { useGetMyParticipation } from '@/shared/api';

import {
  type MeetingViewerRole,
  type ParticipationLookup,
  resolveMeetingViewerRole,
} from './meeting-viewer-role';

function isNotFound(error: unknown): boolean {
  return (error as AxiosError | null)?.response?.status === 404;
}

/**
 * 현황 화면을 보는 사람의 모임 내 역할을 계산한다.
 *
 * 판별 근거가 아직 없으면 `null`이다. 판별 규칙은 `resolveMeetingViewerRole`에 있다.
 */
export function useMeetingViewerRole(inviteCode: string): MeetingViewerRole | null {
  const session = useSession();
  const { nickname, isRestored } = useGuestSession(inviteCode);

  const isAuthenticated = session.status === 'authenticated';

  const participationQuery = useGetMyParticipation(inviteCode, {
    query: {
      // 토큰이 없으면 401만 받는다. 게스트는 이 API의 대상이 아니다.
      enabled: isAuthenticated && inviteCode.length > 0,
      // 404는 "참여자가 아니다"라는 답이다. 재시도할 이유가 없다.
      retry: false,
    },
  });

  let participation: ParticipationLookup = { status: 'pending' };

  if (isAuthenticated) {
    if (participationQuery.isError) {
      participation = isNotFound(participationQuery.error)
        ? { status: 'non-participant' }
        : { status: 'unknown' };
    } else if (participationQuery.data) {
      const participantType = participationQuery.data.participantType;
      participation = participantType
        ? { status: 'participant', participantType }
        : // 참여 정보는 왔는데 역할이 비어 있으면 어느 메뉴를 줘야 할지 알 수 없다.
          { status: 'unknown' };
    }
  }

  return resolveMeetingViewerRole({
    sessionStatus: session.status,
    participation,
    guestNickname: nickname,
    isGuestRestored: isRestored,
  });
}
