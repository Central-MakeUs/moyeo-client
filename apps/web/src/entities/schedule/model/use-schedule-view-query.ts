'use client';

import { useGetScheduleView } from '@/shared/api';

import type { ScheduleSort, ScheduleView } from './schedule-view';

export interface UseScheduleViewQueryResult {
  data?: ScheduleView;
  isLoading: boolean;
  isError: boolean;
}

/**
 * inviteCode가 아직 없으면(쿼리 파싱 전) 빈 문자열을 받는다 — useMeetingDetailQuery와 같은 관례.
 */
export function useScheduleViewQuery(
  inviteCode: string,
  sort: ScheduleSort
): UseScheduleViewQueryResult {
  const { data, isLoading, isError } = useGetScheduleView(
    inviteCode,
    { sort },
    { query: { enabled: inviteCode.length > 0 } }
  );

  return {
    data: data
      ? {
          participantCount: data.participantCount ?? 0,
          candidates: (data.candidates ?? []).map((candidate) => ({
            candidateDate: candidate.candidateDate ?? '',
            startTime: candidate.startTime ?? undefined,
            endTime: candidate.endTime ?? undefined,
            availableParticipantCount: candidate.availableParticipantCount ?? 0,
            availableParticipants: (candidate.availableParticipants ?? []).map((participant) => ({
              participantId: participant.participantId ?? 0,
              nickname: participant.nickname ?? '',
            })),
          })),
        }
      : undefined,
    isLoading,
    isError,
  };
}
