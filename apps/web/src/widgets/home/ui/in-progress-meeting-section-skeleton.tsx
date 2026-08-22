import * as React from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 진행 중 모임 목록의 로딩 상태.
 * 고정 제목은 유지하고 모임 수와 카드 한 개를 스켈레톤으로 표시한다.
 */
export function InProgressMeetingSectionSkeleton(): React.JSX.Element {
  return (
    <section className="flex shrink-0 flex-col gap-[18px] px-5">
      <h2 className="flex gap-[7px]">
        <span className="text-bold-16 text-neutral-900">진행 중 모임</span>
        <Skeleton variant="text" textStyle="extrabold-16" className="w-3" />
      </h2>

      <div className="px-1">
        {/* 실제 MeetingCard와 동일한 레이아웃 */}
        <div className="flex w-full flex-col gap-[18px] rounded-12 border border-accessible-100 bg-accessible-10 px-5 pt-7 pb-6">
          <div className="flex flex-col items-center gap-[14px]">
            <Skeleton variant="text" tone="accessible" textStyle="extrabold-16" className="w-32" />
          </div>
          <hr className="border-accessible-100" />
          <Skeleton tone="accessible" className="h-[150px] w-full" />
          <div className="flex items-center justify-end gap-1.5">
            <Skeleton variant="circular" tone="accessible" className="size-5" />
            <Skeleton variant="text" tone="accessible" textStyle="bold-14" className="w-20" />
          </div>
        </div>
      </div>
    </section>
  );
}
