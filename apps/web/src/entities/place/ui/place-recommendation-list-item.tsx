import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

import { formatLineNames } from '../model/format-line-names';
import { formatTravelTime } from '../model/format-travel-time';
import type { PlaceStation } from '../model/place-view';
import { SubwayLineChip } from './subway-line-chip';

export interface PlaceRecommendationListItemProps {
  areaName: string;
  guName?: string;
  dongName?: string;
  /** 정원이 찬 뒤 저장된 평균 실제 이동시간(초). 아직 없으면 undefined */
  averageTravelTimeSeconds?: number;
  /** 매핑된 지하철역. 그냥 장소라 매핑이 없으면 undefined — 이때는 지하철 정보를 표시하지 않는다. */
  station?: PlaceStation;
}

export function PlaceRecommendationListItem({
  areaName,
  guName,
  dongName,
  averageTravelTimeSeconds,
  station,
}: PlaceRecommendationListItemProps): React.JSX.Element {
  const regionLabel = [guName, dongName].filter(Boolean).join(' ');

  return (
    <div className="flex items-center gap-4 rounded-12 border border-neutral-50 p-4">
      <Icon name="location-neutral" size={24} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-semibold-14 text-neutral-800">{areaName}</p>
          {averageTravelTimeSeconds !== undefined && (
            <span className="shrink-0 text-bold-12 text-neutral-400">
              평균 {formatTravelTime(averageTravelTimeSeconds)}
            </span>
          )}
        </div>

        {station ? (
          <div className="flex items-center gap-1.5">
            <span className="truncate text-bold-14 text-neutral-600">
              지하철 {formatLineNames(station.lineNames)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              {station.lineNames.map((lineName) => (
                <SubwayLineChip key={lineName} lineName={lineName} />
              ))}
            </div>
          </div>
        ) : (
          regionLabel && <p className="truncate text-bold-14 text-neutral-600">{regionLabel}</p>
        )}
      </div>
    </div>
  );
}
