'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // 기본 구조
        'peer relative flex size-5 shrink-0 items-center justify-center rounded-[6px]',
        'border-[1.67px] transition-colors outline-none',

        // 상태별 색상 (unchecked / checked)
        'border-neutral-50 bg-transparent',
        'data-checked:border-accessible-400 data-checked:bg-accessible-100 data-checked:text-accessible-400',

        // 키보드 포커스 (디자이너 승인 필요)
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',

        // 비활성화 (디자이너 승인 필요)
        'disabled:cursor-not-allowed disabled:opacity-50',

        // 클릭 영역 확장
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        {/* 위치·크기는 check.svg(20×20 viewBox)에 baked-in → 정사각형 size 렌더만 */}
        <Icon name="check" size={20} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
