import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { ToastOffsetBoundary } from '../toast';

export interface CTASectionProps {
  /** 영역 하단의 주요 행동. 보통 fullWidth Primary Button을 전달한다. */
  primaryAction: React.ReactNode;
  /** 주요 행동 위에 표시할 선택 행동. */
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function CTASection({ primaryAction, secondaryAction, className }: CTASectionProps) {
  return (
    <ToastOffsetBoundary>
      <section
        className={cn(
          'flex w-full flex-col items-center gap-1 rounded-t-12 bg-transparent px-5 pt-5 pb-11',
          className
        )}
      >
        {secondaryAction}
        {primaryAction}
      </section>
    </ToastOffsetBoundary>
  );
}
