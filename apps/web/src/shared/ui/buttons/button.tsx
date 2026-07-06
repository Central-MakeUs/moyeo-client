import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accessible-400 focus:bg-accessible-600 disabled:cursor-not-allowed disabled:bg-slate-300',
        className
      )}
      type={type}
      {...props}
    />
  );
}
