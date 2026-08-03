'use client';

import { useGetPlaceView } from '@/shared/api';

import type { PlaceView } from './place-view';

export interface UsePlaceViewQueryResult {
  data?: PlaceView;
  isLoading: boolean;
  isError: boolean;
}

/**
 * inviteCode가 아직 없으면(쿼리 파싱 전) 빈 문자열을 받는다 — useMeetingDetailQuery와 같은 관례.
 */
export function usePlaceViewQuery(inviteCode: string): UsePlaceViewQueryResult {
  const { data, isLoading, isError } = useGetPlaceView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  return {
    data: data
      ? {
          participantCount: data.participantCount ?? 0,
          recommendations: (data.recommendations ?? []).map((recommendation) => ({
            rank: recommendation.rank ?? 0,
            areaCode: recommendation.areaCode ?? '',
            areaName: recommendation.areaName ?? '',
            guName: recommendation.guName ?? undefined,
            dongName: recommendation.dongName ?? undefined,
            categoryName: recommendation.categoryName ?? undefined,
            averageStraightDistanceMeters:
              recommendation.averageStraightDistanceMeters ?? undefined,
            averageTravelTimeSeconds: recommendation.averageTravelTimeSeconds ?? undefined,
            station: recommendation.station
              ? {
                  name: recommendation.station.name ?? '',
                  lineNames: recommendation.station.lineNames ?? [],
                }
              : undefined,
          })),
          participants: (data.participants ?? []).map((participant) => ({
            participantId: participant.participantId ?? 0,
            userId: participant.userId ?? null,
            nickname: participant.nickname ?? '',
            isHost: participant.participantType === 'HOST',
            departureName: participant.departureName ?? '',
          })),
        }
      : undefined,
    isLoading,
    isError,
  };
}
