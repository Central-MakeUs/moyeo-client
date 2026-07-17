import * as React from 'react';

import { cn } from '@/shared/lib/cn';

const inputFieldClasses = cn(
  // 레이아웃
  'group/input-field flex w-full flex-col gap-0.5 rounded-12 border px-4 py-3 transition-colors ease-in-out duration-200 text-neutral-950',
  // default
  'border-transparent bg-neutral-10',
  // activated
  `[&:has(input:not(:placeholder-shown)):not(:hover):not(:focus-within):not(:has(input:disabled))]:border-neutral-20`,
  `[&:has(input:not(:placeholder-shown)):not(:hover):not(:focus-within):not(:has(input:disabled))]:bg-white`,
  // hover
  `[&:hover:not(:focus-within):not(:has(input:disabled))]:border-accessible-200`,
  `[&:hover:not(:focus-within):not(:has(input:disabled))]:bg-white`,
  // focus
  'focus-within:border-accessible-400 focus-within:bg-white',
  //filled
  '[&:has(input:not(:placeholder-shown))]:bg-white',
  // error(aria-invalid): 시안에 에러 상태가 정의되면 활성화한다. (보더 토큰은 디자인 확정 후 지정)
  // '[&:has(input[aria-invalid=true]):not(:focus-within)]:border-<TBD>',
  // disabled
  '[&:has(input:disabled)]:border-transparent [&:has(input:disabled)]:bg-neutral-50'
);

function InputField({
  className,
  label,
  hint,
  disabled,
  ...props
}: React.ComponentProps<'input'> & {
  /** 주 라벨*/
  label: React.ReactNode;
  /** 보조 힌트 라벨 */
  hint?: React.ReactNode;
}) {
  return (
    <label data-slot="input-field" className={cn(inputFieldClasses, className)}>
      <span
        data-slot="input-field-label"
        className="text-medium-12 text-neutral-500 group-has-[input:disabled]/input-field:text-neutral-400"
      >
        {label}
        {hint ? <span className="ml-1 text-neutral-400">{hint}</span> : null}
      </span>
      <input
        data-slot="input"
        disabled={disabled}
        className="w-full bg-transparent text-medium-16 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:text-neutral-400"
        {...props}
      />
    </label>
  );
}

export { InputField };
