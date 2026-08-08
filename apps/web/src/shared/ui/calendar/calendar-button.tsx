import React from 'react';
import { DayButton } from 'react-day-picker';
import { format } from 'date-fns';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

const calendarDayButtonClasses = cn(
  // 터치 드래그 선택 중 페이지 스크롤 하이재킹 방지(셀에 상시 적용).
  'touch-none',
  'relative flex w-full h-full items-center justify-center rounded-8 px-0 text-medium-14 transition-colors border-0 text-neutral-850',
  // hover
  'hover:bg-accessible-100',
  // today
  'data-[today=true]:not-data-[selected=true]:[&:not(:disabled)]:text-primary data-[today=true]:not-data-[selected=true]:[&:not(:disabled)]:text-bold-14',

  // selected single
  'data-[selected-single=true]:bg-accessible-400 data-[selected-single=true]:text-white',

  // disabled
  'disabled:pointer-events-none disabled:text-neutral-200',

  // outside / outdated
  'data-[outside=true]:[&:not(:disabled)]:text-accessible-300',

  // range
  'data-[range-start=true]:rounded-r-none data-[range-start=true]:bg-accessible-400 data-[range-start=true]:text-white',
  'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accessible-50',
  'data-[range-end=true]:rounded-l-none data-[range-end=true]:bg-accessible-400 data-[range-end=true]:text-white'
);

export function CalendarDayButton({
  className,
  day,
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  // range 모드의 내장 모디파이어와 multiple 모드의 커스텀 런 모디파이어(run*)를 하나로 합친다.
  const rangeStart = modifiers.range_start || modifiers.runStart;
  const rangeEnd = modifiers.range_end || modifiers.runEnd;
  const rangeMiddle = modifiers.range_middle || modifiers.runMiddle;

  return (
    <Button
      ref={ref}
      variant="ghost"
      // 터치 좌표→날짜 hit-test용 안정적 ISO 앵커(dateFromPoint가 읽음).
      data-date={format(day.date, 'yyyy-MM-dd')}
      data-selected={modifiers.selected}
      // 밴드(start/middle/end)에 속하지 않은 선택 날짜만 solid single.
      data-selected-single={modifiers.selected && !rangeStart && !rangeEnd && !rangeMiddle}
      data-range-start={rangeStart}
      data-range-end={rangeEnd}
      data-range-middle={rangeMiddle}
      data-outside={modifiers.outside}
      data-today={modifiers.today}
      data-disabled={modifiers.disabled}
      className={cn(calendarDayButtonClasses, className)}
      {...props}
    >
      {children}
      {modifiers.today && (
        <span className="absolute inset-x-0 bottom-[1px] text-extrabold-8">오늘</span>
      )}
    </Button>
  );
}
