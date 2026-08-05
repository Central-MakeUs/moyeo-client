import * as React from 'react';

import { cn } from '@/shared/lib/cn';

export interface TopAppBarProps extends Omit<React.ComponentProps<'header'>, 'title'> {
  leading?: React.ReactNode;
  title?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function TopAppBar({ leading, title, trailing, className, ...props }: TopAppBarProps) {
  return (
    <header
      data-slot="top-app-bar"
      className={cn(
        'grid h-[54px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 bg-transparent px-5 text-neutral-950',
        className
      )}
      {...props}
    >
      <div
        data-slot="top-app-bar-leading"
        className="flex min-w-fit shrink-0 items-center justify-self-start whitespace-nowrap"
      >
        {leading}
      </div>

      <div
        data-slot="top-app-bar-title"
        className="w-full min-w-0 text-center text-bold-16 text-neutral-1000"
      >
        {title}
      </div>

      <div data-slot="top-app-bar-trailing" className="flex items-center justify-self-end">
        {trailing}
      </div>
    </header>
  );
}
