import * as React from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 일정 응답을 고치는 화면의 본문 자리표시자.
 *
 * 이 화면은 조회 결과에 따라 캘린더(`DATE_ONLY`)와 시간표(`DATE_AND_TIME`)로 갈리는데,
 * 어느 쪽인지는 `scheduleInputType`이 와야 안다. 그래서 둘 중 하나를 흉내 내지 않고 남은
 * 높이를 채우는 한 덩어리로 둔다 — 하단 CTA가 바닥에 고정돼 있어 어느 쪽이 와도 그 아래는
 * 움직이지 않는다.
 */
export function ScheduleEditorSkeleton(): React.JSX.Element {
  return <Skeleton className="min-h-[360px] w-full flex-1" />;
}
