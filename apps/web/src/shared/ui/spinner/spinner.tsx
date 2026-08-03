import type { ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';

const SIZE_CLASS = {
  sm: 'size-5 border-2',
  md: 'size-8 border-4',
  lg: 'size-12 border-[6px]',
} as const;

export interface SpinnerProps extends Omit<
  ComponentProps<'span'>,
  'children' | 'role' | 'aria-label'
> {
  /** 회전 링의 크기. */
  size?: keyof typeof SIZE_CLASS;
  /** 스크린 리더가 안내할 로딩 상태 이름. */
  label?: string;
}

/**
 * 완료 시점을 알 수 없는 짧은 대기에 사용하는 로딩 표시입니다.
 *
 * 화면 구조를 미리 그릴 수 있는 페이지 로딩에는 Spinner보다 Skeleton을 우선합니다.
 */
export function Spinner({ size = 'lg', label = '불러오는 중', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      data-slot="spinner"
      className={cn('inline-flex', className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'animate-spin rounded-full border-neutral-50 border-t-accessible-300 motion-reduce:animate-none',
          SIZE_CLASS[size]
        )}
      />
    </span>
  );
}
