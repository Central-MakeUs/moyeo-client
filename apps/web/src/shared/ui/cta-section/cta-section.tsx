import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

type CTASectionProps = Omit<React.ComponentProps<typeof Button>, 'fullWidth'> & {
  sectionClassName?: string;
};

export function CTASection({
  children = '다음',
  className,
  sectionClassName,
  ...buttonProps
}: CTASectionProps) {
  return (
    <section className={cn('w-full rounded-t-12 bg-neutral-0 px-5 pt-5 pb-11', sectionClassName)}>
      <Button fullWidth className={className} {...buttonProps}>
        {children}
      </Button>
    </section>
  );
}
