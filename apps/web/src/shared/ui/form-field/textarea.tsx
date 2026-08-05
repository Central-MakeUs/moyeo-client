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
  /** 바깥 FieldShell에 적용할 클래스. */
  containerClassName?: string;
}

function TextareaField({
  id,
  label,
  hint,
  description,
  errorMessage,
  containerClassName,
  className,
  disabled,
  rows = 4,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      description={description}
      errorMessage={errorMessage}
      ariaDescribedBy={ariaDescribedBy}
      className={containerClassName}
    >
      {({ controlId, describedBy, isInvalid }) => (
        <textarea
          {...props}
          id={controlId}
          rows={rows}
          data-slot="field-control"
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={isInvalid ? true : ariaInvalid}
          className={cn(
            'min-h-24 w-full resize-none bg-transparent text-medium-16 text-neutral-950 outline-none',
            'placeholder:whitespace-pre-line placeholder:text-neutral-400',
            'disabled:cursor-not-allowed disabled:text-neutral-400',
            className
          )}
        />
      )}
    </FieldShell>
  );
}

export { TextareaField };
