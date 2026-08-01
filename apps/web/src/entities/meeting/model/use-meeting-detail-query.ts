'use client';

import { useGetMyMeetingDetail } from '@/shared/api';

import type { MeetingDetail } from './meeting-detail';

export interface UseMeetingDetailQueryResult {
  data?: MeetingDetail;
  isLoading: boolean;
  isError: boolean;
}

export function useMeetingDetailQuery(meetingId: number): UseMeetingDetailQueryResult {
  const { data, isLoading, isError } = useGetMyMeetingDetail(meetingId);

  return {
    data: data
      ? {
          name: data.name ?? '',
          description: data.description ?? undefined,
          coverImageUrl: data.coverImageUrl,
        }
      : undefined,
    isLoading,
    isError,
  };
}
