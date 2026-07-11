'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // 기본 구조
        'peer relative inline-flex h-5 w-9 shrink-0 items-center',
        'rounded-full border border-transparent p-px outline-none',

        // 상태 및 애니메이션
        'transition-all',
        'data-[state=checked]:bg-neutral-600',
        'data-[state=unchecked]:bg-neutral-50',

        // 키보드 포커스 (디자이너 승인 필요)
        'focus-visible:border-ring',
        'focus-visible:ring-3 focus-visible:ring-ring/50',

        // 유효성 오류 (디자이너 승인 필요)
        'aria-invalid:border-destructive',
        'aria-invalid:ring-3 aria-invalid:ring-destructive/20',

        // 비활성화 (디자이너 승인 필요)
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',

        // 클릭 영역 확장
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // 모양
          'pointer-events-none block size-4 rounded-full',
          'bg-white shadow-[0_2px_4px_0_rgba(39,39,39,0.1)] ring-0',

          // 위치 및 움직임
          'transition-transform',
          'data-[state=checked]:translate-x-4',
          'data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
