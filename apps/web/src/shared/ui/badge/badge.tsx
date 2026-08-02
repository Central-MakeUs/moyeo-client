import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/cn';

const badgeVariants = cva(
  'inline-flex h-5 shrink-0 items-center justify-center rounded-4 px-2 text-extrabold-10 whitespace-nowrap',
  {
    variants: {
      tone: {
        primary: 'bg-accessible-50 text-accessible-400',
        neutral: 'bg-neutral-20 text-neutral-500',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps extends React.ComponentProps<'span'> {
  tone?: BadgeTone;
}

function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-tone={tone}
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
