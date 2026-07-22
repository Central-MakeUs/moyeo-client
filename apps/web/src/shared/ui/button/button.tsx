import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/shared/lib/cn';

const buttonVariants = cva(
  [
    // 레이아웃
    'group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap',

    // 모양·타이포
    'rounded-8 border border-transparent bg-clip-padding text-bold-16',

    // 상호작용·모션
    'select-none transition-[background-color,border-color,color,box-shadow,transform]',
    'active:not-aria-[haspopup]:translate-y-px',

    // 포커스
    'outline-none focus-visible:ring-3',

    // 비활성
    'disabled:pointer-events-none',

    // 폼 검증 에러
    'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',

    // 아이콘
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    "[&_svg:not([data-slot='icon']):not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground',
          'hover:bg-accessible-400',
          'focus-visible:bg-accessible-600 focus-visible:ring-accessible-300',
          'active:bg-accessible-700',
          'disabled:bg-neutral-70',
        ],
        outline: [
          'border-neutral-50 bg-white text-neutral-600',
          'hover:border-accessible-300 hover:text-neutral-950',
          'focus-visible:ring-accessible-300 focus-visible:bg-accessible-50 focus-visible:text-accessible-500',
          'active:border-accessible-500 active:text-neutral-950',
          'disabled:bg-neutral-50 disabled:text-white',
        ],
        ghost: [
          'border-transparent bg-transparent text-current',
          'hover:bg-neutral-20',
          'focus-visible:ring-neutral-200 focus-visible:bg-neutral-20',
          'active:bg-neutral-50',
          'disabled:text-neutral-70',
        ],
      },
      size: {
        default:
          'h-12 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'p-1',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
