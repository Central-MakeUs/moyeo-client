import * as React from 'react';

import { cn } from '@/shared/lib/cn';

const inputFieldClasses = cn(
  // 레이아웃
  'group/input-field relative flex w-full flex-col gap-0.5 rounded-12 border px-4 py-3 transition-colors ease-in-out duration-200 text-neutral-950',
  // default
  'border-transparent bg-neutral-10',
  // activated
  `[&:has(input:not(:placeholder-shown)):not(:hover):not(:focus-within):not(:has(input:disabled)):not([data-invalid])]:border-neutral-20`,
  `[&:has(input:not(:placeholder-shown)):not(:hover):not(:focus-within):not(:has(input:disabled))]:bg-white`,
  // hover
  `[&:hover:not(:focus-within):not(:has(input:disabled)):not([data-invalid])]:border-accessible-200`,
  `[&:hover:not(:focus-within):not(:has(input:disabled))]:bg-white`,
  // focus
  '[&:focus-within:not([data-invalid])]:border-accessible-400 focus-within:bg-white',
  // filled
  '[&:has(input:not(:placeholder-shown))]:bg-white',
  // error: 값·hover·focus 상태보다 우선하되 disabled일 때는 disabled 보더를 유지한다.
  '[&[data-invalid]:not(:has(input:disabled))]:border-accessible-600',
  // disabled
  '[&:has(input:disabled)]:border-transparent [&:has(input:disabled)]:bg-neutral-50'
);

function InputField({
  className,
  label,
  hint,
  disabled,
  description,
  errorMessage,
  trailingAction,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  id,
  ...props
}: React.ComponentProps<'input'> & {
  /** 주 라벨*/
  label: React.ReactNode;
  /** 보조 힌트 라벨 */
  hint?: React.ReactNode;
  /** 입력창 오른쪽에 표시할 보조 동작. */
  trailingAction?: React.ReactNode;
  description?: string;
  errorMessage?: string;
}) {
  const message = errorMessage ?? description;
  const isInvalid = Boolean(errorMessage);
  const generatedInputId = React.useId();
  const inputId = id ?? generatedInputId;
  const messageId = `${React.useId()}-message`;

  let describedBy = ariaDescribedBy;

  if (message) {
    describedBy = ariaDescribedBy ? `${ariaDescribedBy} ${messageId}` : messageId;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        data-slot="input-field"
        data-invalid={isInvalid || undefined}
        className={cn(inputFieldClasses, className)}
      >
        <label
          htmlFor={inputId}
          data-slot="input-field-label"
          className="text-medium-12 text-neutral-500 group-has-[input:disabled]/input-field:text-neutral-400"
        >
          {label}
          {hint ? <span className="ml-1 text-neutral-400">{hint}</span> : null}
        </label>
        <input
          id={inputId}
          data-slot="input"
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={isInvalid ? true : ariaInvalid}
          className={cn(
            'w-full bg-transparent text-medium-16 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:text-neutral-400',
            trailingAction && 'pr-10'
          )}
          {...props}
        />
        {trailingAction ? (
          <span className="absolute right-[15px] bottom-[13px] flex">{trailingAction}</span>
        ) : null}
      </div>
      {message && (
        <small
          id={messageId}
          data-slot={isInvalid ? 'input-field-error' : 'input-field-description'}
          className={cn(
            'px-1.5 text-medium-12',
            isInvalid ? 'text-accessible-600' : 'text-neutral-400'
          )}
        >
          {message}
        </small>
      )}
    </div>
  );
}

export { InputField };
