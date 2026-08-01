import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

export interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  /** 채워지는 인디케이터 색상·모양을 덮어쓸 className. */
  indicatorClassName?: string;
}

function Progress({ className, indicatorClassName, value, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        'relative flex h-1 w-full items-center overflow-hidden bg-neutral-20 duration-200 ease-in-out',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full flex-1 bg-accessible-400 transition-all',
          (value ?? 0) < 100 && 'rounded-r-full',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
