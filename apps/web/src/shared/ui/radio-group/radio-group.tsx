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
        'group/radio-group-card flex w-full items-center gap-4 rounded-12 px-4 py-3 text-left transition-colors outline-none',

        // default
        'bg-neutral-10',

        // selected
        'data-[state=checked]:bg-accessible-50',

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

/**
 * 아이콘형 카드 라디오 옵션. 라디오 점 대신 **아이콘이 선택 표시를 대체**한다.
 * 선택/미선택 아이콘은 별도 에셋(멀티컬러 일러스트라 CSS 틴트 불가)을 받아
 * radix `data-[state=checked]` 로 swap 한다.
 */
function RadioGroupIconCard({
  className,
  title,
  description,
  selectedIcon,
  unselectedIcon,
  ...props
}: Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, 'children'> & {
  /** 카드 제목 */
  title: React.ReactNode;
  /** 카드 보조 설명 */
  description?: React.ReactNode;
  /** 선택됐을 때 표시할 아이콘 */
  selectedIcon: React.ReactNode;
  /** 선택되지 않았을 때 표시할 아이콘 */
  unselectedIcon: React.ReactNode;
}) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-icon-card"
      className={cn(
        // 레이아웃 (아이콘 + 텍스트, 아이콘이 점을 대체)
        'group/radio-group-icon-card flex w-full items-center gap-5 rounded-12 px-6 py-5 text-left transition-colors outline-none',

        // 키보드 포커스
        'focus-visible:ring-3 focus-visible:ring-ring/50',

        // 비활성화
        'disabled:cursor-not-allowed',

        'bg-neutral-10 text-neutral-600 data-[state=checked]:bg-accessible-50 data-[state=checked]:text-accessible-900',
        className
      )}
      {...props}
    >
      {/** 아이콘 */}
      <span
        aria-hidden="true"
        className="relative flex size-7 shrink-0 items-center justify-center"
      >
        <span className="flex size-full">{unselectedIcon}</span>
        <RadioGroupPrimitive.Indicator className="absolute inset-0 flex items-center justify-center bg-accessible-50">
          {selectedIcon}
        </RadioGroupPrimitive.Indicator>
      </span>

      {/* 텍스트 */}
      <span className="flex flex-col gap-0.5">
        <span className="text-bold-16">{title}</span>
        {description ? <span className="text-medium-12">{description}</span> : null}
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupCard, RadioGroupIconCard };
