import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

const selectTriggerClasses = cn(
  // 레이아웃
  'group/select flex w-full items-end gap-2 rounded-12 border px-4 py-3 text-left transition-colors duration-200 ease-in-out',

  // default / activated (값 유무는 보더가 아니라 value 색으로 구분)
  'border-neutral-50 bg-white',

  // hover
  '[&:hover:not(:disabled):not(:focus-visible)]:border-accessible-200',

  // focus — 키보드 포커스 + drawer 열림 (vaul이 data-state=open 을 붙임)
  'focus-visible:border-accessible-400 focus-visible:outline-none',
  'data-[state=open]:border-accessible-400',

  // disabled
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-20'
);

/** Select 트리거 박스. 클릭 시 옵션 drawer 표시 */
function SelectTrigger({
  className,
  label,
  value,
  placeholder,
  disabled,
  type = 'button',
  ...props
}: Omit<React.ComponentProps<'button'>, 'value'> & {
  /** 상단 title 라벨 */
  label: React.ReactNode;
  /** 선택된 값 (없으면 placeholder 노출) */
  value?: React.ReactNode;
  /** 값이 없을 때 노출할 안내 텍스트 */
  placeholder?: React.ReactNode;
}) {
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <button
      type={type}
      data-slot="select-trigger"
      disabled={disabled}
      className={cn(selectTriggerClasses, className)}
      {...props}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span data-slot="select-label" className="text-medium-12 text-neutral-500">
          {label}
        </span>
        <span
          data-slot="select-value"
          className={cn(
            // 기본 구조
            'truncate text-medium-16',

            // 값 유무에 따른 색 (activated / placeholder)
            hasValue ? 'text-neutral-950' : 'text-neutral-500',

            // 비활성화
            'group-disabled/select:text-neutral-400'
          )}
        >
          {hasValue ? value : placeholder}
        </span>
      </span>
      <Icon
        name="caret-down"
        size={24}
        className={cn(
          // 기본
          'text-neutral-600',

          // drawer 열림 — 위를 향하도록 180도 회전
          'transition-transform duration-200 ease-in-out group-data-[state=open]/select:rotate-180',

          // 비활성화
          'group-disabled/select:text-neutral-100'
        )}
        aria-hidden
      />
    </button>
  );
}

export { SelectTrigger };
