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
        {/* 모임 이름 */}
        <Skeleton variant="text" textStyle="bold-18" className="w-40" />
        {/* 모임 설명 */}
        <Skeleton variant="text" textStyle="semibold-14" className="w-4/5" />
      </div>

      <div className="flex w-full items-center justify-end gap-1.5">
        {/* 방장 아이콘과 닉네임 */}
        <Skeleton variant="circular" className="size-5" />
        <Skeleton variant="text" textStyle="semibold-14" className="w-16" />
      </div>
    </div>
  );
}
