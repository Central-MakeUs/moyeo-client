'use client';

import { useGetMeetingView } from '@/shared/api';

import type { MeetingDetail } from './meeting-detail';

export interface UseMeetingDetailQueryResult {
  data?: MeetingDetail;
  isLoading: boolean;
  isError: boolean;
}

/**
 * inviteCode가 아직 없으면(쿼리 파싱 전) 빈 문자열을 받는다 — useInvitation과 같은 관례.
 */
export function useMeetingDetailQuery(inviteCode: string): UseMeetingDetailQueryResult {
  const { data, isLoading, isError } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  return {
    data: data
      ? {
          name: data.name ?? '',
          description: data.description ?? undefined,
          coverImageUrl: data.coverImageUrl,
          capacity: data.maxParticipants ?? 0,
          joinedCount: data.participantCount ?? 0,
          planningType: data.planningType ?? 'SCHEDULE_AND_PLACE',
        }
      : undefined,
    isLoading,
    isError,
  };
}
