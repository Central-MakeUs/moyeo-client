import * as React from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/** 모임 유형을 알기 전에도 확정할 수 있는 현황 화면의 공통 구조. */
export function MeetingOverviewSkeleton(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="모임 정보를 불러오는 중"
      className="relative -mt-17.25 flex flex-col gap-7 px-5 pb-16"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-14 border border-accessible-100 bg-accessible-10 px-4 py-6">
          <Skeleton variant="text" tone="accessible" textStyle="extrabold-18" className="w-36" />
          <Skeleton variant="text" tone="accessible" textStyle="semibold-14" className="w-4/5" />
        </div>

        <div className="flex items-center py-8">
          <Skeleton className="size-[42px] shrink-0" />
          <Skeleton className="mx-3 h-1.5 flex-1 rounded-full" />
          <Skeleton className="size-[42px] shrink-0" />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-0.5">
        <Skeleton variant="text" textStyle="bold-16" className="w-28" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-18 w-full" />
          <Skeleton className="h-18 w-full" />
        </div>
      </div>
    </div>
  );
}
