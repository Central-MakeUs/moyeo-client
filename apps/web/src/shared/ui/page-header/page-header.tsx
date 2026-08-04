import * as React from 'react';

import { cn } from '@/shared/lib/cn';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  /**
   * 제목의 색·타이포를 바꿀 때 쓴다.
   *
   * 제목이 자기 색을 갖고 있어 바깥 `className`으로는 덮이지 않는다. 화면마다 제목 색이
   * 다른 경우가 있어 여기로 받는다.
   */
  titleClassName?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  align = 'left',
  className,
  titleClassName,
  children,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2',
        align === 'center' && 'items-center text-center',
        className
      )}
    >
      <div className="space-y-0.5">
        <h1 className={cn('text-extrabold-22 break-keep text-neutral-900', titleClassName)}>
          {title}
        </h1>

        {description && <p className="text-bold-14 break-keep text-neutral-600">{description}</p>}
      </div>

      {children}
    </header>
  );
}
