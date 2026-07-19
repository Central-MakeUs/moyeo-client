'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

/**
 * 라디오 옵션들을 묶는 컨테이너. 하나의 값만 선택되도록 관리한다.
 *
 * 안에 `RadioGroupCard`들을 자식으로 넣어 사용하며, 선택 값은 `value`/`defaultValue`(+ `onValueChange`)로 제어한다.
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-4', className)}
      {...props}
    />
  );
}

/**
 * 카드형 라디오 옵션. `RadioGroup` 안에서 여러 개를 묶어 사용한다.
 *
 * 카드 전체가 곧 radio item(button)이므로 카드 어디를 눌러도 선택된다.
 * (label로 감싸면 button 컨트롤로 클릭이 전달되지 않아 Primitive.Item을 카드로 직접 사용한다.)
 */
function RadioGroupCard({
  className,
  title,
  description,
  ...props
}: Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, 'children'> & {
  /** 카드 제목 */
  title: React.ReactNode;
  /** 카드 보조 설명 */
  description?: React.ReactNode;
}) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-card"
      className={cn(
        // 레이아웃
        'group/radio-group-card flex w-full items-center gap-3 rounded-12 border px-4 py-3 text-left transition-colors outline-none',

        // default
        'border-neutral-10 bg-neutral-10',

        // selected
        'data-[state=checked]:border-accessible-50 data-[state=checked]:bg-accessible-50',

        // 키보드 포커스 (디자이너 승인 필요)
        'focus-visible:ring-3 focus-visible:ring-ring/50',

        // 비활성화
        'disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* 라디오 원 (20px) — 클릭 대상은 카드 전체이고, 이 원은 선택 상태를 시각적으로만 표현한다. */}
      <span
        aria-hidden="true"
        className={cn(
          // 모양
          'relative flex size-5 shrink-0 items-center justify-center rounded-full border bg-white transition-[border-color,border-width]',
          // default
          'border-neutral-70',
          // selected
          'group-data-[state=checked]/radio-group-card:border-[5px] group-data-[state=checked]/radio-group-card:border-accessible-400'
        )}
      />

      {/* 텍스트 */}
      <span className="flex flex-col gap-0.5">
        <span
          className={cn(
            'text-semibold-16',
            'text-neutral-500',
            'group-data-[state=checked]/radio-group-card:text-primary',
            'group-disabled/radio-group-card:text-neutral-300'
          )}
        >
          {title}
        </span>
        {description ? (
          <span
            className={cn(
              'text-medium-12',
              'text-neutral-400',
              'group-data-[state=checked]/radio-group-card:text-accessible-400',
              'group-disabled/radio-group-card:text-neutral-200'
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupCard };
