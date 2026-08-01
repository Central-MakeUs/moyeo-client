'use client';

import { useGetMyMeetings, type Item } from '@/shared/api';

import type { MeetingSummary } from './meeting-summary';

export interface UseMeetingsQueryResult {
  data: {
    inProgress: MeetingSummary[];
    confirmed: MeetingSummary[];
  };
  isLoading: boolean;
  isError: boolean;
}

function toMeetingSummary(item: Item): MeetingSummary {
  return {
    meetingId: item.meetingId ?? 0,
    name: item.name ?? '',
    coverImageUrl: item.coverImageUrl,
    capacity: item.maxParticipants ?? 0,
    joinedCount: item.participantCount ?? 0,
    confirmedScheduleDate: item.confirmedScheduleDate,
    confirmedStartTime: item.confirmedStartTime,
    confirmedEndTime: item.confirmedEndTime,
    confirmedPlaceName: item.confirmedPlaceName,
  };
}

export function useMeetingsQuery(): UseMeetingsQueryResult {
  const { data, isLoading, isError } = useGetMyMeetings();

  return {
    data: {
      inProgress: (data?.planningMeetings ?? []).map(toMeetingSummary),
      confirmed: (data?.confirmedMeetings ?? []).map(toMeetingSummary),
    },
    isLoading,
    isError,
  };
}
