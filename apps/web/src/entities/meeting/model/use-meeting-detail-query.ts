'use client';

import { useGetMeetingView } from '@/shared/api';

import type { MeetingDetail } from './meeting-detail';

export interface UseMeetingDetailQueryResult {
  data?: MeetingDetail;
  isLoading: boolean;
  /** 캐시를 보여주면서 뒤에서 다시 읽는 중인지. 갓 바뀐 값을 기다릴 때 쓴다. */
  isFetching: boolean;
  isError: boolean;
}

export interface UseMeetingDetailQueryOptions {
  /**
   * 캐시가 아직 신선해도 마운트할 때 다시 읽을지.
   *
   * 전역 staleTime이 60초라, 방금 바뀐 값을 봐야 하는 화면은 캐시를 그대로 쓰면 옛 값을
   * 그린다. 확정 화면이 그런 경우다 — 확정 직후 도착하는데 캐시에는 확정 전 모임이 있다.
   */
  fresh?: boolean;
}

/**
 * inviteCode가 아직 없으면(쿼리 파싱 전) 빈 문자열을 받는다 — useInvitation과 같은 관례.
 */
export function useMeetingDetailQuery(
  inviteCode: string,
  { fresh = false }: UseMeetingDetailQueryOptions = {}
): UseMeetingDetailQueryResult {
  const { data, isLoading, isFetching, isError } = useGetMeetingView(inviteCode, {
    query: {
      enabled: inviteCode.length > 0,
      ...(fresh ? { staleTime: 0, refetchOnMount: 'always' as const } : {}),
    },
  });

  return {
    data: data
      ? {
          name: data.name ?? '',
          description: data.description ?? undefined,
          coverImageUrl: data.coverImageUrl ?? undefined,
          capacity: data.maxParticipants ?? 0,
          joinedCount: data.participantCount ?? 0,
          planningType: data.planningType ?? 'SCHEDULE_AND_PLACE',
          isConfirmed: data.meetingConfirmed ?? false,
          confirmedScheduleDate: data.confirmedScheduleDate ?? undefined,
          confirmedStartTime: data.confirmedStartTime ?? undefined,
          confirmedEndTime: data.confirmedEndTime ?? undefined,
          confirmedPlaceName: data.confirmedPlaceName ?? undefined,
          participants: (data.participants ?? []).map((participant) => ({
            participantId: participant.participantId ?? 0,
            userId: participant.userId ?? null,
            nickname: participant.nickname ?? '',
            isHost: participant.participantType === 'HOST',
          })),
        }
      : undefined,
    isLoading,
    isFetching,
    isError,
  };
}
