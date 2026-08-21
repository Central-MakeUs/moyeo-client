'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/cn';

import { FieldShell } from './field-shell';

export interface TextareaFieldProps extends React.ComponentPropsWithoutRef<'textarea'> {
  /**
   * 주 라벨.
   * 생략하면 호출부에서 `aria-label` 또는 `aria-labelledby`를 제공해야 한다.
   */
  label?: React.ReactNode;
  /** 라벨 옆에 표시할 보조 힌트. */
  hint?: React.ReactNode;
  /** 필드 아래에 표시할 안내 문구. */
  description?: string;
  /** 필드 아래에 표시할 에러 문구. description보다 우선한다. */
  errorMessage?: string;
  /** FieldShell에 적용할 클래스. */
  className?: string;
  /** 실제 textarea 요소에 적용할 클래스. */
  textareaClassName?: string;
  /**
   * 글자 수 표시 방식. maxLength가 있을 때만 표시한다.
   * `auto`는 포커스되었거나 입력값이 있을 때 표시한다.
   */
  characterCountVisibility?: 'always' | 'auto' | 'never';
}

function TextareaField({
  id,
  label,
  hint,
  description,
  errorMessage,
  className,
  textareaClassName,
  disabled,
  rows = 4,
  value,
  defaultValue,
  maxLength,
  onChange,
  onFocus,
  onBlur,
  characterCountVisibility = 'never',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [uncontrolledCharacterCount, setUncontrolledCharacterCount] = React.useState(
    () => String(defaultValue ?? '').length
  );
  const characterCount = value === undefined ? uncontrolledCharacterCount : String(value).length;

  const shouldShowCharacterCount =
    maxLength !== undefined &&
    characterCountVisibility !== 'never' &&
    (characterCountVisibility === 'always' ||
      (characterCountVisibility === 'auto' && (isFocused || characterCount > 0)));
  const hasReachedMaxLength = maxLength !== undefined && characterCount >= maxLength;

  return (
    <div className="flex flex-col gap-1.5">
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        description={description}
        errorMessage={errorMessage}
        isLimitReached={hasReachedMaxLength}
        ariaDescribedBy={ariaDescribedBy}
        className={className}
      >
        {({ controlId, describedBy, isInvalid }) => (
          <textarea
            {...props}
            id={controlId}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            maxLength={maxLength}
            data-slot="field-control"
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={isInvalid ? true : ariaInvalid}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            onChange={(event) => {
              const inputValue = event.currentTarget.value;
              const limitedValue =
                maxLength === undefined ? inputValue : inputValue.slice(0, maxLength);

              if (inputValue !== limitedValue) {
                event.currentTarget.value = limitedValue;
              }

              // 부모가 value를 넘겨주지 않는 경우 컴포넌트 내부 state로 처리
              if (value === undefined) {
                setUncontrolledCharacterCount(limitedValue.length);
              }

              onChange?.(event);
            }}
            className={cn(
              'min-h-0 w-full flex-1 resize-none bg-transparent text-medium-16 text-neutral-950 outline-none',
              'placeholder:whitespace-pre-line placeholder:text-neutral-400',
              'disabled:cursor-not-allowed disabled:text-neutral-400',
              textareaClassName
            )}
          />
        )}
      </FieldShell>
      {shouldShowCharacterCount ? (
        <span className="self-end text-semibold-12" role="status" aria-live="polite">
          <span className={cn('text-neutral-800', hasReachedMaxLength && 'text-accessible-600')}>
            {characterCount}
          </span>
          <span className={cn('text-neutral-400', hasReachedMaxLength && 'text-accessible-600')}>
            /{maxLength}
          </span>
        </span>
      ) : undefined}
    </div>
  );
}

export { TextareaField };
