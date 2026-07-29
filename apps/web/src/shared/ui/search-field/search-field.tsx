'use client';

import React from 'react';
import { Icon } from '../icon';
import { cn } from '@/shared/lib/cn';

export interface SearchFieldProps extends Omit<React.ComponentProps<'input'>, 'type' | 'size'> {
  /** 입력 필드 전체 컨테이너에 적용할 클래스 */
  containerClassName?: string;
  /** 초기화 버튼을 눌렀을 때 호출되는 핸들러 함수 */
  onClear?: () => void;
  /** 초기화 버튼의 접근성 이름 */
  clearLabel?: string;
}

/**
 * 컴포넌트의 책임
 * - 검색어 입력
 * - 검색 아이콘 표시
 * - 값이 있고 focus 시 초기화 버튼 표시
 * - default / hover/ focus / disabled 스타일
 * - 접근성이 있는 label과 clear 동작
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      value,
      defaultValue,
      disabled,
      readOnly,
      placeholder = '검색어를 입력해주세요',
      containerClassName,
      className,
      onChange,
      onKeyDown,
      onClear,
      clearLabel = '검색어 지우기',
      ...props
    },
    forwardedRef
  ) {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(forwardedRef, () => internalRef.current as HTMLInputElement);

    // 부모가 value를 관리하는지
    const isControlled = value !== undefined;

    const [inputValue, setInputValue] = React.useState(() =>
      defaultValue == null ? '' : String(defaultValue)
    );

    const currentValue = isControlled ? String(value ?? '') : inputValue;
    const hasValue = currentValue.length > 0;
    const canClear = hasValue && !disabled && !readOnly;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInputValue(event.target.value);
      }

      onChange?.(event);
    };

    const clear = () => {
      if (disabled || readOnly) {
        return;
      }

      if (!isControlled) {
        setInputValue('');
      }

      onClear?.();

      requestAnimationFrame(() => {
        internalRef.current?.focus();
      });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === 'Escape' && canClear) {
        event.preventDefault();
        clear();
      }
    };

    return (
      <div
        data-slot="search-field"
        data-disabled={disabled || undefined}
        className={cn(
          [
            // Layout
            'group/search-field relative flex h-13 w-full shrink-0 items-center gap-2',
            'rounded-10 px-5',

            // Default
            'bg-neutral-10 text-medium-14 text-neutral-500',

            // Hover
            'not-has-disabled:hover:bg-neutral-20',

            // Focus - TODO: 디자이너님과 합의

            // Disabled
            'has-disabled:cursor-not-allowed has-disabled:bg-neutral-50 has-disabled:text-neutral-300',
          ],
          containerClassName
        )}
      >
        <Icon
          name="search"
          className={cn(
            'size-5 shrink-0',
            'overflow-hidden opacity-100',
            'transition-[width,opacity] duration-150 ease-in-out',
            'group-focus-within/search-field:w-0',
            'group-focus-within/search-field:opacity-0',
            'text-neutral-400 group-has-disabled/search-field:text-neutral-200'
          )}
        />

        <input
          {...props}
          ref={internalRef}
          type="search"
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn(
            [
              'min-w-0 flex-1 bg-transparent',
              'text-medium-16 text-neutral-850',
              'outline-none',

              'placeholder:text-neutral-500',

              'disabled:cursor-not-allowed',
              'disabled:text-neutral-400',
              'disabled:placeholder:text-neutral-300',

              // 브라우저 기본 search clear 버튼 제거
              '[&::-webkit-search-cancel-button]:hidden',
              '[&::-webkit-search-decoration]:hidden',
            ],
            className
          )}
        />

        {canClear && (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={clear}
            className={cn(
              'relative flex size-5 shrink-0 items-center justify-center',
              'rounded-full bg-neutral-500 text-white',
              'outline-none',
              'hover:bg-neutral-600',
              'focus-visible:ring-2 focus-visible:ring-primary',
              'after:absolute after:-inset-2',
              'not-group-focus-within/search-field:hidden'
            )}
          >
            <Icon name="close" className="size-3" />
          </button>
        )}
      </div>
    );
  }
);
