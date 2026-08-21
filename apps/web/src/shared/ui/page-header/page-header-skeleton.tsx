import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

/** 제목 줄별 너비. 두 줄짜리 제목은 아래 줄이 짧게 끝나는 편이라 폭을 줄인다. */
const TITLE_LINE_WIDTH_CLASSES = ['w-2/3', 'w-1/2'] as const;

export interface PageHeaderSkeletonProps {
  /** 제목이 몇 줄인지. 실제 화면이 `<br />`로 두 줄을 쓰면 2를 준다. */
  titleLines?: 1 | 2;
  /** 설명 줄을 그릴지. 설명 없는 화면은 `false`. */
  hasDescription?: boolean;
  className?: string;
}

/**
 * `PageHeader`의 로딩 자리표시자.
 *
 * 제목·설명의 타이포 토큰과 줄 간격을 `PageHeader`와 같게 맞춰, 값이 도착해도 아래 본문이
 * 밀리지 않게 한다. 토큰이 바뀌면 함께 움직이도록 `PageHeader` 옆에 둔다.
 *
 * 로딩 상태는 이것을 감싸는 쪽이 알린다(`role="status"`).
 */
export function PageHeaderSkeleton({
  titleLines = 1,
  hasDescription = true,
  className,
}: PageHeaderSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="space-y-1">
        {/* 실물은 `<br />`로 줄을 나눈 하나의 h1이라 줄 사이에 간격이 없다. */}
        <div className="flex flex-col">
          {TITLE_LINE_WIDTH_CLASSES.slice(0, titleLines).map((width) => (
            <Skeleton key={width} variant="text" textStyle="extrabold-22" className={width} />
          ))}
        </div>

        {hasDescription && <Skeleton variant="text" textStyle="bold-14" className="w-1/2" />}
      </div>
    </div>
  );
}
