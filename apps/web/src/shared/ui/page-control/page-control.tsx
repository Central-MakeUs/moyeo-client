import * as React from 'react';

import { cn } from '@/shared/lib/cn';

export interface PageControlProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** 전체 점 개수 */
  total: number;
  /** 현재 활성 점 인덱스 (0-based, embla의 selectedScrollSnap()과 동일 기준) */
  current: number;
}

/**
 * 캐러셀 하단 페이지 인디케이터.
 * 활성 페이지만 가로로 늘어난 알약으로, 나머지는 작은 원으로 표시한다.
 * 값은 주입만 받고 스크롤 상태는 감지하지 않는다 — 캐러셀과의 연결은 조립하는 쪽 책임.
 */
function PageControl({ total, current, className, ...props }: PageControlProps): React.JSX.Element {
  return (
    <div data-slot="page-control" className={cn('flex items-center gap-2', className)} {...props}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          data-slot="page-control-dot"
          className={cn(
            'h-1.5 rounded-full',
            index === current ? 'w-5 bg-accessible-400' : 'w-1.5 bg-neutral-300/30'
          )}
        />
      ))}
    </div>
  );
}

export { PageControl };
