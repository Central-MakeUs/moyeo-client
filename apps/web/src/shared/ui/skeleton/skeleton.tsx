import * as React from 'react';

import { cn } from '@/shared/lib/cn';

/** 로딩 자리표시자. 표현 전용이라 자체 role을 갖지 않는다(감싸는 쪽이 role="status"). */
export type SkeletonProps = React.ComponentProps<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps): React.JSX.Element {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn('animate-pulse rounded-8 bg-neutral-10', className)}
      {...props}
    />
  );
}
