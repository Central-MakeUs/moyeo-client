import * as React from 'react';
import { format, parseISO } from 'date-fns';

import { Icon } from '@/shared/ui/icon';
import { Thumbnail } from '@/shared/ui/thumbnail';

export interface ConfirmedMeetingListItemProps {
  title: string;
  /** ISO 날짜(YYYY-MM-DD) */
  confirmedDate: string;
  /** "HH:mm". 없으면(DATE_ONLY) 날짜만 표시 */
  confirmedStartTime?: string;
  /** 있을 경우만 표시 */
  place?: string;
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  thumbnailUrl?: string;
}

export function ConfirmedMeetingListItem({
  title,
  confirmedDate,
  confirmedStartTime,
  place,
  thumbnailUrl,
}: ConfirmedMeetingListItemProps): React.JSX.Element {
  const dateLabel = `${format(parseISO(confirmedDate), 'yyyy년 M월 d일')}${
    confirmedStartTime ? ` ${confirmedStartTime.slice(0, 2)}시` : ''
  }`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-12 bg-white px-4 py-[14px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="truncate text-bold-14 text-neutral-800">{title}</p>
        <div className="flex flex-col gap-0.5 text-semibold-12 text-neutral-500">
          <div className="flex items-center gap-1">
            <Icon name="calendar-icon" className="size-4 text-neutral-300" />
            <span className="truncate">{dateLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="location" className="size-4 text-neutral-300" />
            <span className="truncate">{place}</span>
          </div>
        </div>
      </div>
      <Thumbnail imageUrl={thumbnailUrl} iconSize={32} className="h-15 w-15 shrink-0" />
    </div>
  );
}
