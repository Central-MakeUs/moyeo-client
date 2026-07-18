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
    // 모션·상호작용
    'transition-all select-none active:not-aria-[haspopup]:translate-y-px',
    // 포커스 (a11y)
    'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    // 비활성
    'disabled:pointer-events-none',
    // 폼 검증 에러
    'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
    // 아이콘
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-accessible-400 focus-visible:bg-accessible-600 active:bg-accessible-700 disabled:bg-neutral-70',
        // outline: '',
        // secondary: '',
        ghost: '',
        // destructive: '',
        // link: '',
      },
      size: {
        default:
          'h-12 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        // xs: '',
        // sm: '',
        // lg: '',
        icon: 'size-7.5 rounded-6 bg-white text-neutral-100 hover:bg-neutral-20 focus-visible:bg-accessible-600 active:bg-neutral-50',
        // 'icon-xs':
        //   "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        // 'icon-sm':
        //   'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        // 'icon-lg': 'size-9',
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
