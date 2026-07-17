import * as React from 'react';
import { isSameDay } from 'date-fns';

import { Calendar } from './calendar';
import { CalendarDayButton } from './calendar-button';
import { computeRuns } from './compute-runs';
import { dateFromPoint } from './date-from-point';
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
  const isDragStartedRef = React.useRef(false);
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
    isDragStartedRef.current = false;
    setIsDraggingMoved(false);
  };

  // 드래그 취소 — 커밋 없이 상태를 되돌린다(포인터가 캘린더 영역을 벗어날 때).
  const cancelDrag = () => {
    drag.cancel();
    resetPointerTracking();
  };

  // 셀 진입 공통 처리 — 마우스(pointerenter)와 터치 좌표 매핑(pointermove)이 공유한다.
  const enterDay = (day: Date) => {
    const anchor = anchorRef.current;
    if (!anchor || isSameDay(day, anchor)) return;
    if (!isDragStartedRef.current) {
      drag.start(anchor); // 첫 이동에서 비로소 드래그 시작
      isDragStartedRef.current = true;
      setIsDraggingMoved(true);
    }
    drag.enter(day);
  };

  const handlePointerDownDay = (e: React.PointerEvent, day: Date) => {
    // 아직 드래그를 시작하지 않는다 — anchor만 기록. (탭이면 pointer 경로 미개입)
    anchorRef.current = day;
    isDragStartedRef.current = false;
    // 터치는 시작 셀에 포인터가 캡처돼 다른 셀 pointerenter가 안 뜬다 →
    // 캡처를 걸어 pointermove를 계속 받고 좌표로 셀을 해석한다.
    if (e.pointerType === 'touch' && typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMoveDay = (e: React.PointerEvent) => {
    // 터치 좌표 매핑: pointerenter가 안 뜨는 터치 드래그를 좌표→셀로 보완.
    const target = dateFromPoint(e.clientX, e.clientY);
    if (target) enterDay(target);
  };

  const handlePointerUpDay = () => {
    if (isDragStartedRef.current) {
      onChange(drag.commit());
      suppressNextClick(); // 드래그 뒤 같은 이벤트 흐름의 click만 무시
    }
    // 단일 셀(탭)이면 pointer 경로는 아무것도 안 하고 click(onSelect)이 처리.
    resetPointerTracking();
  };

  // DayButton을 렌더마다 새로 만들면 RDP가 셀을 전부 remount → 진행 중인 드래그가 끊긴다.
  // 최신 핸들러는 ref로 넘기고, 컴포넌트 정체성은 useMemo([])로 고정해 리마운트를 막는다.
  const handlers = { handlePointerDownDay, handlePointerMoveDay, handlePointerUpDay, enterDay };
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  const components = React.useMemo(
    () => ({
      DayButton: (props: React.ComponentProps<typeof CalendarDayButton>) => {
        const day = props.day.date;
        return (
          <CalendarDayButton
            {...props}
            onPointerDown={(e) => handlersRef.current.handlePointerDownDay(e, day)}
            onPointerEnter={() => handlersRef.current.enterDay(day)}
            onPointerMove={(e) => handlersRef.current.handlePointerMoveDay(e)}
            onPointerUp={() => handlersRef.current.handlePointerUpDay()}
          />
        );
      },
    }),
    []
  );

  // 렌더 중인 선택(드래그 미리보기 포함)에서 연속 런 세그먼트를 계산해 RDP 커스텀 모디파이어로 주입.
  const shown = isDraggingMoved ? drag.previewValue : value;
  const runs = computeRuns(shown);

  return (
    <div
      onPointerLeave={() => {
        if (anchorRef.current) cancelDrag();
      }}
    >
      <Calendar
        mode="multiple"
        showOutsideDays={false}
        selected={shown}
        modifiers={{
          runStart: runs.runStart,
          runMiddle: runs.runMiddle,
          runEnd: runs.runEnd,
          runSingle: runs.runSingle,
        }}
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
        components={components}
      />
    </div>
  );
}
