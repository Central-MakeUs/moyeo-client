'use client';

import * as React from 'react';

import { PlaceRecommendationListItem, usePlaceViewQuery } from '@/entities/place';

export interface PlaceRecommendationsSectionProps {
  inviteCode: string;
}

export function PlaceRecommendationsSection({
  inviteCode,
}: PlaceRecommendationsSectionProps): React.JSX.Element {
  const { data, isLoading, isError } = usePlaceViewQuery(inviteCode);

  return (
    <section className="flex flex-col gap-4 px-0.5">
      <h2 className="flex items-center gap-1.5">
        <span className="text-bold-16 text-neutral-850">추천 위치 후보</span>
        <span className="text-extrabold-16 text-neutral-600">
          {data?.recommendations.length ?? 0}
        </span>
      </h2>

      {isLoading && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">불러오는 중...</p>
      )}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          위치 정보를 불러오지 못했어요
        </p>
      )}

      {data &&
        (data.recommendations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-12 bg-neutral-10 px-4 py-[30px]">
            <span className="text-bold-14 text-neutral-400">추천 위치 후보가 없어요</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.recommendations.map((recommendation) => (
              <PlaceRecommendationListItem
                key={recommendation.rank}
                areaName={recommendation.areaName}
                guName={recommendation.guName}
                dongName={recommendation.dongName}
                averageTravelTimeSeconds={recommendation.averageTravelTimeSeconds}
                station={recommendation.station}
              />
            ))}
          </div>
        ))}
    </section>
  );
}
