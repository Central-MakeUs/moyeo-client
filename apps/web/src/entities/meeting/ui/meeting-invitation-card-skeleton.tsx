import * as React from 'react';

import { Skeleton } from '@/shared/ui';

/**
 * `MeetingInvitationCard`의 로딩 자리표시자.
 *
 * 카드와 같은 테두리·여백을 써서 로딩이 끝날 때 자리가 튀지 않게 한다. 언제 보여줄지는
 * 로딩 상태를 아는 호출부가 정한다.
 */
export function MeetingInvitationCardSkeleton(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="모임 정보를 불러오는 중"
      className="flex w-full flex-col items-center gap-4.5 rounded-12 border border-accessible-100 bg-[#FFF9F9] px-5 py-6"
    >
      <div className="flex w-full flex-col items-center gap-2 border-b border-b-accessible-100 pb-5">
        {/* 이름: text-bold-18 한 줄 */}
        <Skeleton className="h-[25px] w-40" />
        {/* 설명: text-semibold-14 한 줄 */}
        <Skeleton className="h-[20px] w-full" />
      </div>

      <div className="flex w-full items-center justify-end gap-1.5">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-[20px] w-16" />
      </div>
    </div>
  );
}
