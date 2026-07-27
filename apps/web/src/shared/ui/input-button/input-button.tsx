import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';

const inputButtonClasses = cn(
  // 레이아웃
  'group/input-button flex w-full items-end gap-2 rounded-12 border px-4 py-3 text-left text-neutral-950 transition-colors duration-200 ease-in-out',

  // default
  'border-transparent bg-neutral-10',

  // hover
  '[&:hover:not(:disabled):not(:focus-visible)]:border-accessible-200 [&:hover:not(:disabled):not(:focus-visible)]:bg-white',

  // focus / active
  'focus-visible:border-accessible-400 focus-visible:bg-white focus-visible:outline-none',
  'data-[state=open]:border-accessible-400 data-[state=open]:bg-white',

  // disabled
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-50'
);

interface InputButtonProps extends Omit<React.ComponentProps<'button'>, 'value'> {
  /** 상단에 표시할 라벨 */
  label: string;
  /** 확정된 값. 없으면 placeholder를 표시한다. */
  value?: string;
  /** 값이 없을 때 표시할 안내 문구 */
  placeholder?: string;
  /** 우측에 표시할 아이콘 */
  trailingIcon?: IconName;
  /** Drawer가 열렸을 때 아이콘을 180도 회전할지 여부 */
  rotateIconOnOpen?: boolean;
}

/** 라벨과 현재 값을 표시하며 입력 화면이나 Drawer를 여는 버튼 */
function InputButton({
  className,
  label,
  value,
  placeholder,
  trailingIcon = 'chevron-right',
  rotateIconOnOpen = false,
  disabled,
  type = 'button',
  ...props
}: InputButtonProps) {
  const hasValue = value !== undefined && value !== '';

  return (
    <button
      {...props}
      type={type}
      data-slot="input-button"
      data-has-value={hasValue || undefined}
      disabled={disabled}
      className={cn(
        inputButtonClasses,
        'flex items-center',
        hasValue && 'border-neutral-20 bg-white',
        className
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          data-slot="input-button-label"
          className="text-medium-12 text-neutral-500 group-disabled/input-button:text-neutral-400"
        >
          {label}
        </span>
        <span
          data-slot="input-button-value"
          className={cn(
            'truncate text-medium-16',
            hasValue ? 'text-neutral-950' : 'text-neutral-400',
            'group-disabled/input-button:text-neutral-400'
          )}
        >
          {hasValue ? value : placeholder}
        </span>
      </span>

      <Icon
        name={trailingIcon}
        size={24}
        className={cn(
          hasValue ? 'text-neutral-200' : 'text-neutral-100',
          rotateIconOnOpen &&
            'transition-transform duration-200 ease-in-out group-data-[state=open]/input-button:rotate-180',
          'group-disabled/input-button:text-neutral-100'
        )}
      />
    </button>
  );
}

export { InputButton };
export type { InputButtonProps };
