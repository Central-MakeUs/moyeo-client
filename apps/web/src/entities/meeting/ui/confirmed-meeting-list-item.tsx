import * as React from 'react';
import { format, parseISO } from 'date-fns';

import { Icon } from '@/shared/ui/icon';
import { Thumbnail } from '@/shared/ui/thumbnail';

export interface ConfirmedMeetingListItemProps {
  title: string;
  /** ISO 날짜(YYYY-MM-DD). 장소만 조율한 모임은 확정 일정이 없어 생략된다. */
  confirmedDate?: string;
  /** "HH:mm". 없으면(DATE_ONLY) 날짜만 표시 */
  confirmedStartTime?: string;
  /** 있을 경우만 표시 */
  place?: string;
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  thumbnailUrl?: string;
  /** 탭 시 확정된 모임 상세를 연다(HOME-01-F03). */
  onClick?: () => void;
}

export function ConfirmedMeetingListItem({
  title,
  confirmedDate,
  confirmedStartTime,
  place,
  thumbnailUrl,
  onClick,
}: ConfirmedMeetingListItemProps): React.JSX.Element {
  /*
   * 확정 일정이 없는 모임이 있다. 장소만 조율하면 날짜가 아예 없고, 그때 parseISO('')가
   * Invalid Date가 되어 format이 던진다. 값이 있을 때만 만든다.
   */
  const dateLabel = confirmedDate
    ? `${format(parseISO(confirmedDate), 'yyyy년 M월 d일')}${
        confirmedStartTime ? ` ${confirmedStartTime.slice(0, 2)}시` : ''
      }`
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-12 bg-white px-4 py-[14px] text-left outline-none"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="truncate text-bold-14 text-neutral-800">{title}</p>
        {/* 일정만 조율한 모임은 위치가, 장소만 조율한 모임은 일정이 없다. */}
        <div className="flex flex-col gap-0.5 text-semibold-12 text-neutral-500">
          {dateLabel && (
            <div className="flex items-center gap-1">
              <Icon name="calendar-icon" className="size-4 text-neutral-300" />
              <span className="truncate">{dateLabel}</span>
            </div>
          )}
          {place && (
            <div className="flex items-center gap-1">
              <Icon name="location" className="size-4 text-neutral-300" />
              <span className="truncate">{place}</span>
            </div>
          )}
        </div>
      </div>
      <Thumbnail imageUrl={thumbnailUrl} iconSize={28} className="h-15 w-15 shrink-0 rounded-10" />
    </button>
  );
}
