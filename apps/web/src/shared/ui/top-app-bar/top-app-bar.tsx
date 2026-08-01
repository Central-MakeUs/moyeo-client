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
        'flex h-[54px] w-full items-center justify-between gap-4 bg-transparent px-5 text-neutral-950',
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div data-slot="top-app-bar-leading" className="flex shrink-0 items-center">
          {leading}
        </div>

        <div
          data-slot="top-app-bar-title"
          className="min-w-0 truncate text-bold-16 text-neutral-700"
        >
          {title}
        </div>
      </div>

      <div data-slot="top-app-bar-trailing" className="flex shrink-0 items-center">
        {trailing}
      </div>
    </header>
  );
}
