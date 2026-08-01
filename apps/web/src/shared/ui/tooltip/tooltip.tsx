import * as React from 'react';

import TooltipArrow from '@/shared/assets/illustrations/tooltip-arrow.svg';
import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';

export interface TooltipProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  icon?: IconName;
  children: React.ReactNode;
}

export function Tooltip({ icon, children, className, ...props }: TooltipProps): React.JSX.Element {
  return (
    <div
      className={cn('absolute bottom-0 flex -translate-x-1/2 flex-col items-center', className)}
      {...props}
    >
      <div className="flex h-7 items-center justify-center gap-1 rounded-8 bg-accessible-50 px-2.5 py-1">
        {icon && <Icon name={icon} size={16} />}
        <p className="text-bold-14">{children}</p>
      </div>
      <TooltipArrow />
    </div>
  );
}
