'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col', className)} {...props} />
  );
}

/**
 * 세그먼트 트랙. `TabsTrigger`들을 감싸는 pill 배경.
 */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('inline-flex w-full items-center gap-1 rounded-8 bg-neutral-20 p-1', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // 레이아웃
        'h-[34px] flex-1 rounded-8 px-1.5 text-semibold-14 whitespace-nowrap',

        // 상태 및 애니메이션
        'text-neutral-600 transition-colors outline-none',
        'data-[state=active]:bg-white data-[state=active]:text-neutral-900',

        // 키보드 포커스
        'focus-visible:ring-3 focus-visible:ring-ring/50',

        // 비활성화
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
