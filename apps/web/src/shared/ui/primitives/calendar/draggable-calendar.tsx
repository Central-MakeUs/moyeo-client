import * as React from 'react';

import { Calendar } from './calendar';

export interface DraggableCalendarProps {
  /** 선택된 날짜 집합 (제어). 순서 무관, 내부에서 집합으로 취급. */
  value: Date[];
  /** 선택 변경 시 호출. 다음 선택 집합(불변 새 배열)을 넘긴다. */
  onChange: (next: Date[]) => void;
  /** 비활성(선택 불가) 판정. true면 선택 대상에서 제외. 미주입 시 전부 활성. */
  isDateDisabled?: (date: Date) => boolean;
  /** 표시 월 (제어, 선택). 미주입 시 RDP 내부 상태로 관리(비제어). */
  month?: Date;
  /** 표시 월 변경 시 호출. */
  onMonthChange?: (month: Date) => void;
  className?: string;
}

export function DraggableCalendar({
  value,
  onChange,
  isDateDisabled,
  month,
  onMonthChange,
  className,
}: DraggableCalendarProps): React.JSX.Element {
  return (
    <Calendar
      mode="multiple"
      selected={value}
      onSelect={(next) => onChange(next ?? [])}
      disabled={isDateDisabled}
      month={month}
      onMonthChange={onMonthChange}
      className={className}
    />
  );
}
