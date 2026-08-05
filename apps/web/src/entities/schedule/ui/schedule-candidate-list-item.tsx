import * as React from 'react';
import { format, parseISO } from 'date-fns';

import { AvatarGroup } from '@/shared/ui';
import { Icon } from '@/shared/ui/icon';

export interface ScheduleCandidateListItemProps {
  /** ISO 날짜(YYYY-MM-DD) */
  candidateDate: string;
  /** "HH:mm:ss" 또는 "HH:mm". DATE_ONLY 모임이면 undefined */
  startTime?: string;
  /** "HH:mm:ss" 또는 "HH:mm". DATE_ONLY 모임이면 undefined */
  endTime?: string;
  /** 이 후보에 참여 가능한 인원 */
  availableParticipantCount: number;
  /** 모임 전체 참여 인원 */
  participantCount: number;
  /** 후보 상세를 여는 동작. 생략하면 눌러도 아무 일도 하지 않는다. */
  onClick?: () => void;
}

export function ScheduleCandidateListItem({
  candidateDate,
  startTime,
  endTime,
  availableParticipantCount,
  participantCount,
  onClick,
}: ScheduleCandidateListItemProps): React.JSX.Element {
  const date = parseISO(candidateDate);
  const weekdayLabel = date.toLocaleDateString('ko', { weekday: 'short' });

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-[14px] rounded-12 px-2 py-2.5 text-left outline-none"
    >
      <div className="flex h-[58px] w-[51px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-8 bg-neutral-20">
        <span className="text-extrabold-14 text-neutral-700">{format(date, 'M.d')}</span>
        <span className="text-bold-14 text-neutral-500">{weekdayLabel}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {startTime && endTime && (
          <div className="flex items-center gap-1">
            <Icon name="clock" size={16} className="text-neutral-400" />
            <span className="text-bold-14 text-neutral-600">
              {startTime.slice(0, 5)}~{endTime.slice(0, 5)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <AvatarGroup capacity={participantCount} joinedCount={availableParticipantCount} />
          <p className="text-bold-14">
            <span className="text-accessible-400">{availableParticipantCount}</span>
            <span className="text-neutral-600">{`/${participantCount}명 가능`}</span>
          </p>
        </div>
      </div>

      <Icon name="chevron-right" size={24} className="shrink-0 text-neutral-70" />
    </button>
  );
}
