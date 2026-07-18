import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

type CTASectionProps = Omit<React.ComponentProps<typeof Button>, 'fullWidth'> & {
  buttonClassName?: string;
};

export function CTASection({
  children = '다음',
  className,
  buttonClassName,
  ...buttonProps
}: CTASectionProps) {
  return (
    <section className={cn('rounded-t-md w-full bg-neutral-0 px-5 pt-5 pb-11', className)}>
      <Button fullWidth className={buttonClassName} {...buttonProps}>
        {children}
      </Button>
    </section>
  );
}
