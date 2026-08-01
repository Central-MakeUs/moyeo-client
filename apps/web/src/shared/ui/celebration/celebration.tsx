'use client';
import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';

import { CelebrationConfetti } from './celebration-confetti';

export interface CelebrationProps {
  icon: IconName;
  iconClassName?: string;
  className?: string;
  /** 컨페티를 터뜨릴지 여부. 축하할 상황이 아니면 `false`로 아이콘만 남긴다. */
  hasConfetti?: boolean;
}

/**
 * 완료 화면에서 사용하는 220 × 180 축하 그래픽.
 * 페이지는 의미에 맞는 중앙 아이콘만 정하고, 컨페티의 크기와 움직임은 이 컴포넌트가 맡는다.
 */
export function Celebration({
  icon,
  iconClassName,
  className,
  hasConfetti = true,
}: CelebrationProps): React.JSX.Element {
  return (
    <div
      className={cn('relative h-[180px] w-[220px] overflow-hidden', className)}
      aria-hidden="true"
    >
      {hasConfetti && <CelebrationConfetti />}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Icon name={icon} className={cn('size-[75px]', iconClassName)} />
      </div>
    </div>
  );
}
