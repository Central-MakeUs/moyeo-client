import * as React from 'react';
import { isSameDay } from 'date-fns';

import { Calendar } from './calendar';
import { CalendarDayButton } from './calendar-button';
import { isWithinMaxCount } from './is-within-max-count';
import { useDragSelect } from './use-drag-select';

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
  /** 최대 선택 가능 일수(개수). 미주입=무제한. */
  maxSelectedDays?: number;
  /** 개수 초과(드래그 clamp / 탭 거부) 시 제스처당 1회 호출. */
  onLimitExceeded?: () => void;
}

export function DraggableCalendar({
  value,
  onChange,
  isDateDisabled,
  month,
  onMonthChange,
  className,
  maxSelectedDays,
  onLimitExceeded,
}: DraggableCalendarProps): React.JSX.Element {
  const drag = useDragSelect({ value, isDateDisabled, maxSelectedDays, onLimitExceeded });
  const anchorRef = React.useRef<Date | null>(null);
  const movedRef = React.useRef(false);
  const suppressClickRef = React.useRef(false);
  const suppressClickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // "실제(다른 셀로 이동한) 드래그" 여부 — 이때만 미리보기를 표시한다.
  // 단일 셀(탭)은 pointerdown이 미리보기를 켜지 않게 해서 뒤따르는 click(onSelect)이 처리하게 둔다.
  const [isDraggingMoved, setIsDraggingMoved] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (suppressClickTimerRef.current) {
        clearTimeout(suppressClickTimerRef.current);
      }
    };
  }, []);

  const clearSuppressedClick = () => {
    suppressClickRef.current = false;
    if (suppressClickTimerRef.current) {
      clearTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = null;
    }
  };

  const suppressNextClick = () => {
    clearSuppressedClick();
    suppressClickRef.current = true;
    suppressClickTimerRef.current = setTimeout(() => {
      clearSuppressedClick();
    }, 0);
  };

  // 포인터 추적 상태 초기화 — cancelDrag/onPointerUp 공통.
  const resetPointerTracking = () => {
    anchorRef.current = null;
    movedRef.current = false;
    setIsDraggingMoved(false);
  };

  // 드래그 취소 — 커밋 없이 상태를 되돌린다(포인터가 캘린더 영역을 벗어날 때).
  const cancelDrag = () => {
    drag.cancel();
    resetPointerTracking();
  };

  return (
    <div
      onPointerLeave={() => {
        if (anchorRef.current) cancelDrag();
      }}
    >
      <Calendar
        mode="multiple"
        showOutsideDays={false}
        selected={isDraggingMoved ? drag.previewValue : value}
        // 탭(click)은 RDP onSelect로 처리. 드래그 종료 직후의 click은 무시한다.
        onSelect={(next) => {
          if (suppressClickRef.current) {
            clearSuppressedClick();
            return;
          }
          const nextValue = next ?? [];
          // 탭으로 새 날짜를 추가할 때 개수 초과면 거부하고 알린다(제거·비초과는 통과).
          if (maxSelectedDays !== undefined && !isWithinMaxCount(nextValue, maxSelectedDays)) {
            onLimitExceeded?.();
            return;
          }
          onChange(nextValue);
        }}
        disabled={isDateDisabled}
        month={month}
        onMonthChange={onMonthChange}
        className={className}
        components={{
          DayButton: (props: React.ComponentProps<typeof CalendarDayButton>) => {
            const day = props.day.date;
            return (
              <CalendarDayButton
                {...props}
                onPointerDown={() => {
                  // 아직 드래그를 시작하지 않는다 — anchor만 기록. (탭이면 pointer 경로 미개입)
                  anchorRef.current = day;
                  movedRef.current = false;
                }}
                onPointerEnter={() => {
                  const anchor = anchorRef.current;
                  if (!anchor || isSameDay(day, anchor)) return;
                  if (!movedRef.current) {
                    drag.start(anchor); // 첫 이동에서 비로소 드래그 시작
                    movedRef.current = true;
                    setIsDraggingMoved(true);
                  }
                  drag.enter(day);
                }}
                onPointerUp={() => {
                  if (movedRef.current) {
                    onChange(drag.commit());
                    suppressNextClick(); // 드래그 뒤 같은 이벤트 흐름의 click만 무시
                  }
                  // 단일 셀(탭)이면 pointer 경로는 아무것도 안 하고 click(onSelect)이 처리.
                  resetPointerTracking();
                }}
              />
            );
          },
        }}
      />
    </div>
  );
}
