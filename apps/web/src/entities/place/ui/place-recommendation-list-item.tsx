import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

export interface PlaceRecommendationListItemProps {
  areaName: string;
  guName?: string;
  dongName?: string;
}

export function PlaceRecommendationListItem({
  areaName,
  guName,
  dongName,
}: PlaceRecommendationListItemProps): React.JSX.Element {
  const regionLabel = [guName, dongName].filter(Boolean).join(' ');

  return (
    <div className="flex items-center gap-4 rounded-12 border border-neutral-50 p-4">
      <Icon name="location-neutral" size={24} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-semibold-14 text-neutral-800">{areaName}</p>
          <span className="shrink-0 text-bold-12 text-neutral-400">평균 N분</span>
        </div>

        {regionLabel && <p className="truncate text-bold-14 text-neutral-600">{regionLabel}</p>}
      </div>
    </div>
  );
}
