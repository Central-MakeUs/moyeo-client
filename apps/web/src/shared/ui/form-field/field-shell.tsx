import * as React from 'react';

import { cn } from '@/shared/lib/cn';

const fieldShellClasses = cn(
  // 레이아웃
  'group/field relative flex w-full flex-col gap-0.5 rounded-12 border px-4 py-3 text-neutral-950 transition-colors duration-200 ease-in-out',

  // default
  'border-transparent bg-neutral-10',

  // activated
  '[&:has([data-slot=field-control]:not(:placeholder-shown)):not(:hover):not(:focus-within):not(:has([data-slot=field-control]:disabled)):not([data-invalid]):not([data-limit-reached])]:border-neutral-20',
  '[&:has([data-slot=field-control]:not(:placeholder-shown)):not(:hover):not(:focus-within):not(:has([data-slot=field-control]:disabled))]:bg-white',

  // hover
  '[&:hover:not(:focus-within):not(:has([data-slot=field-control]:disabled)):not([data-invalid]):not([data-limit-reached])]:border-accessible-200',
  '[&:hover:not(:focus-within):not(:has([data-slot=field-control]:disabled))]:bg-white',

  // focus
  '[&:focus-within:not([data-invalid]):not([data-limit-reached])]:border-accessible-400 focus-within:bg-white',

  // filled
  '[&:has([data-slot=field-control]:not(:placeholder-shown))]:bg-white',

  // error
  '[&[data-invalid]:not(:has([data-slot=field-control]:disabled))]:border-accessible-600',

  // limit reached
  '[&[data-limit-reached]:not(:has([data-slot=field-control]:disabled))]:border-accessible-600',

  // disabled
  '[&:has([data-slot=field-control]:disabled)]:border-transparent',
  '[&:has([data-slot=field-control]:disabled)]:bg-neutral-50'
);

interface FieldShellRenderProps {
  controlId: string;
  describedBy: string | undefined;
  isInvalid: boolean;
}

interface FieldShellProps {
  className?: string;
  id?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  description?: string;
  errorMessage?: string;
  isLimitReached?: boolean;
  ariaDescribedBy?: string;
  children: (props: FieldShellRenderProps) => React.ReactNode;
}

export function FieldShell({
  className,
  id,
  label,
  hint,
  description,
  errorMessage,
  isLimitReached,
  ariaDescribedBy,
  children,
}: FieldShellProps) {
  const generatedControlId = React.useId();
  const generatedMessageId = React.useId();

  const controlId = id ?? generatedControlId;
  const message = errorMessage ?? description;
  const isInvalid = Boolean(errorMessage);
  const messageId = message ? `${generatedMessageId}-message` : undefined;

  const describedBy = messageId
    ? ariaDescribedBy
      ? `${ariaDescribedBy} ${messageId}`
      : messageId
    : ariaDescribedBy;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        data-slot="field-shell"
        data-invalid={isInvalid || undefined}
        data-limit-reached={isLimitReached || undefined}
        className={cn(fieldShellClasses, className)}
      >
        {label ? (
          <label
            htmlFor={controlId}
            data-slot="field-label"
            className="text-medium-12 text-neutral-500 group-has-[[data-slot=field-control]:disabled]/field:text-neutral-400"
          >
            {label}
            {hint ? <span className="ml-1 text-neutral-400">{hint}</span> : null}
          </label>
        ) : null}

        {children({
          controlId,
          describedBy,
          isInvalid,
        })}
      </div>

      {message ? (
        <small
          id={messageId}
          data-slot={isInvalid ? 'field-error' : 'field-description'}
          className={cn(
            'px-1.5 text-medium-12',
            isInvalid ? 'text-accessible-600' : 'text-neutral-400'
          )}
        >
          {message}
        </small>
      ) : null}
    </div>
  );
}
