'use client';

import { toApiAssetUrl, useGetMyMeetings, type Item } from '@/shared/api';

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
    inviteCode: item.inviteCode ?? '',
    name: item.name ?? '',
    coverImageUrl: toApiAssetUrl(item.coverImageUrl ?? undefined),
    capacity: item.maxParticipants ?? 0,
    joinedCount: item.participantCount ?? 0,
    confirmedScheduleDate: item.confirmedScheduleDate ?? undefined,
    confirmedStartTime: item.confirmedStartTime ?? undefined,
    confirmedEndTime: item.confirmedEndTime ?? undefined,
    confirmedPlaceName: item.confirmedPlaceName ?? undefined,
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
