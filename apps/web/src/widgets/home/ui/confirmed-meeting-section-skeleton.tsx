import * as React from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/** 로딩 중 표시할 확정 모임 항목 수. */
const SKELETON_ITEM_COUNT = 2;

/**
 * 확정된 모임 목록의 로딩 상태.
 * 고정 제목은 유지하고 모임 수와 목록을 스켈레톤으로 표시한다.
 */
export function ConfirmedMeetingSectionSkeleton(): React.JSX.Element {
  return (
    <section className="flex flex-1 flex-col gap-4.5 bg-neutral-10 px-5 py-6">
      <h2 className="flex shrink-0 gap-[7px]">
        <span className="text-bold-16 text-neutral-900">확정된 모임</span>
        <Skeleton variant="text" textStyle="extrabold-16" className="w-3" />
      </h2>

      <div className="flex flex-1 flex-col gap-3">
        {Array.from({ length: SKELETON_ITEM_COUNT }, (_, index) => (
          <div
            key={index}
            className="flex w-full items-center justify-between gap-3 rounded-12 bg-white px-4 py-[14px]"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton variant="text" textStyle="bold-14" className="w-2/3" />
              {/* 일정과 위치가 모두 있는 항목을 기준으로 두 줄을 표시한다. */}
              <div className="flex flex-col gap-0.5">
                <Skeleton variant="text" textStyle="semibold-12" className="w-1/2" />
                <Skeleton variant="text" textStyle="semibold-12" className="w-2/5" />
              </div>
            </div>
            <Skeleton className="size-15 shrink-0 rounded-10" />
          </div>
        ))}
      </div>
    </section>
  );
}
