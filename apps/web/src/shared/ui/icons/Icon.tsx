import * as React from 'react';

import { cn } from '@/shared/lib/cn';

import Caret from './assets/caret.svg';
import Check from './assets/check.svg';
import Chevron from './assets/chevron.svg';
import Close from './assets/close.svg';
import Minus from './assets/minus.svg';
import Plus from './assets/plus.svg';

const ICONS = {
  caret: Caret,
  check: Check,
  chevron: Chevron,
  close: Close,
  minus: Minus,
  plus: Plus,
} as const;

export type IconName = keyof typeof ICONS;

type IconRotate = 0 | 90 | 180 | 270;

type IconProps = Omit<React.SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
  rotate?: IconRotate;
};

function Icon({ name, size = 24, rotate = 0, className, style, ...props }: IconProps) {
  const Component = ICONS[name];

  return (
    <Component
      data-slot="icon"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      style={rotate ? { transform: `rotate(${rotate}deg)`, ...style } : style}
      {...props}
    />
  );
}

export { Icon };
