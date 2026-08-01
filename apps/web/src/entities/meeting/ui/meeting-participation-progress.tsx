import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { Progress, Tooltip } from '@/shared/ui';

export interface MeetingParticipationProgressProps {
  joinedCount: number;
  capacity: number;
}

export function MeetingParticipationProgress({
  joinedCount,
  capacity,
}: MeetingParticipationProgressProps): React.JSX.Element {
  const progressPercent = capacity > 0 ? Math.min(100, (joinedCount / capacity) * 100) : 0;
  const isComplete = joinedCount >= capacity;

  return (
    <div className="flex flex-1 items-center">
      <div className="flex flex-col items-center gap-1.5 pt-8">
        <div className="flex size-[42px] flex-col items-center justify-center rounded-8 border-2 border-accessible-50 bg-accessible-100">
          <Icon name="invitation" size={24} />
        </div>
        <span className="text-bold-14 text-accessible-400">초대</span>
      </div>

      <div className="relative flex flex-1 items-center justify-center pt-11.5 pb-11">
        <Tooltip icon="group" className="top-0" style={{ left: `${progressPercent}%` }}>
          <span className="text-accessible-500">{joinedCount}</span>
          <span className="text-neutral-600">{`/${capacity}`}</span>
        </Tooltip>

        <Progress
          value={progressPercent}
          className="h-1.5"
          indicatorClassName="bg-linear-to-r from-[#FFB6B4] to-accessible-400"
        />
      </div>

      <div className="flex flex-col items-center gap-1.5 pt-8">
        <div
          className={cn(
            'flex size-[42px] flex-col items-center justify-center rounded-8 border-2',
            isComplete
              ? 'border-accessible-50 bg-accessible-100'
              : 'border-neutral-50 bg-neutral-10'
          )}
        >
          <Icon name="note" size={24} />
        </div>
        <span
          className={cn('text-bold-14', isComplete ? 'text-accessible-400' : 'text-neutral-300')}
        >
          완료
        </span>
      </div>
    </div>
  );
}
