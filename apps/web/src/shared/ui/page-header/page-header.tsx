import * as React from 'react';

import { cn } from '@/shared/lib/cn';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  align = 'left',
  className,
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
        <h1 className="text-extrabold-22 break-keep text-neutral-900">{title}</h1>

        {description && <p className="text-medium-14 break-keep text-neutral-600">{description}</p>}
      </div>

      {children}
    </header>
  );
}
