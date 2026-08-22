import * as React from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/** 교통수단 선택지 수. `DepartureRadioGroup`이 그리는 칸과 같은 수를 잡는다. */
const TRANSPORTATION_MODE_COUNT = 2;

/**
 * 출발지·이동수단을 고치는 화면의 본문 자리표시자.
 *
 * 실제 화면(`EditDeparturePage`)의 `InputButton` 한 개와 교통수단 라벨·선택지 배치를 따른다.
 */
export function DepartureEditorSkeleton(): React.JSX.Element {
  return (
    <div className="flex w-full flex-col gap-4">
      <Skeleton className="h-16 w-full rounded-12" />

      <div className="flex flex-col gap-2.5">
        <Skeleton variant="text" textStyle="medium-14" className="w-40" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: TRANSPORTATION_MODE_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-[104px] w-full rounded-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
