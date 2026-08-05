import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Avatar, type AvatarSize } from '@/shared/ui/avatar';

import { computeAvatarGroupSlots } from './compute-avatar-group-slots';

/** 앞 아바타와 겹치는 폭. 시안의 20px 아바타가 14px 간격으로 놓이는 비율을 따른다. */
const OVERLAP_CLASS = '-ml-1.5 first:ml-0';

export interface AvatarGroupProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** 정원 */
  capacity: number;
  /** 참여 완료 인원 */
  joinedCount: number;
  /** 아바타 크기. 기본 20(시안의 카드 내 사용 기준). */
  size?: AvatarSize;
}

/** 참여 현황을 원형 아바타 목록으로 보여준다. 표시 규칙은 computeAvatarGroupSlots가 정한다. */
export function AvatarGroup({
  capacity,
  joinedCount,
  size = 20,
  className,
  ...props
}: AvatarGroupProps): React.JSX.Element {
  const { slots, overflow } = computeAvatarGroupSlots({ capacity, joinedCount });

  return (
    <div data-slot="avatar-group" className={cn('flex items-center', className)} {...props}>
      {slots.map((slot, index) => (
        <Avatar
          key={index}
          size={size}
          tone={slot === 'filled' ? 'primary' : 'neutral'}
          className={cn(
            OVERLAP_CLASS,
            'border-white', // 겹침 분리용 흰 테두리
            slot === 'filled' && 'bg-accessible-100' // 그룹 내 참여 아바타만 진하게
          )}
        />
      ))}

      {overflow !== null && (
        <span
          data-slot="avatar-group-overflow"
          className={cn(
            'relative inline-flex shrink-0 items-center justify-center rounded-full',
            'border border-accessible-300 bg-accessible-50 text-accessible-400',
            'text-extrabold-8',
            OVERLAP_CLASS
          )}
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
