'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

import { cn } from '@/shared/lib/cn';

import { applyCellSelection } from './apply-cell-selection';
import { buildRectCellKeys } from './build-rect-cell-keys';
import { toCellKey } from './cell-key';
import { cellKeyFromPoint } from './cell-key-from-point';
import { getCellState, type CellState } from './get-cell-state';
import { getPaintMode } from './get-paint-mode';
import { useAxisLockedTouchScroll } from './use-axis-locked-touch-scroll';
import { useCellDragSelect } from './use-cell-drag-select';
import { useEdgeAutoScroll } from './use-edge-auto-scroll';

/** 상태별 배경 토큰 (spec-fixed §6-3). 리터럴 클래스로 붙여야 상태 검증이 가능하다. */
const CELL_STATE_CLASS: Record<CellState, string> = {
  disabled: 'bg-neutral-0',
  // hover는 Tailwind v4에서 @media (hover: hover)로 컴파일된다 → 터치에선 적용되지 않는다.
  default: 'bg-neutral-10 hover:bg-accessible-50',
  selected: 'bg-accessible-100',
};

/** 셀 너비 */
const TIME_LABEL_WIDTH = 'w-[52px] shrink-0';
const CELL_WIDTH = 'w-[60px] shrink-0';

/** disabledKeys 미주입 시 매 렌더 새 Set을 만들지 않도록 고정한다. */
const EMPTY_KEYS: ReadonlySet<string> = new Set<string>();

/** 터치를 이만큼 유지하면 선택 모드로 본다. 그 전에 움직이면 스크롤이다. */
export const LONG_PRESS_MS = 200;

/** 셀의 접근성 이름. 빈 버튼이라 라벨이 없으면 스크린리더가 읽을 게 없다. */
function formatCellLabel(date: string, time: string): string {
  return `${format(parseISO(date), 'M월 d일')} ${time.slice(0, 2)}시`;
}

export interface AvailabilityTimeGridProps {
  /** 열 = 날짜 'yyyy-MM-dd' 오름차순. 도메인(후보 날짜)을 모른다. */
  columns: string[];
  /** 행 = 시각 'HH:mm' 1시간 블록. buildTimeRows 결과를 넣는다. */
  rows: string[];
  /** 선택된 셀 키 (제어). */
  value: string[];
  /** 선택 변경 시 다음 집합(불변 새 배열)을 넘긴다. */
  onChange: (next: string[]) => void;
  /** 비활성 셀 키. 탭·드래그 어느 경로로도 선택되지 않는다. */
  disabledKeys?: ReadonlySet<string>;
  /**
   * 그리드 전체를 선택 불가로 만든다. 제출 중처럼 화면을 얼려야 할 때 쓴다.
   *
   * `disabledKeys`로 모든 셀을 덮는 것으로는 부족하다 — 드래그 판정이 셀이 아니라
   * 컨테이너에 있어 그 경로가 남는다. **스크롤은 그대로 둔다.**
   */
  disabled?: boolean;
  /**
   * 터치 롱프레스로 선택 모드에 들어간 순간 호출된다.
   *
   * 이 그리드는 플랫폼을 모르므로 햅틱 같은 피드백은 호출부가 붙인다.
   * 사용자가 "지금부터 스크롤이 아니라 선택"임을 알아채는 유일한 신호라 중요하다.
   */
  onSelectionStart?: () => void;
  className?: string;
}

/**
 * 후보 날짜 × 1시간 블록 그리드.
 *
 * 드래그 메커니즘은 `DraggableCalendar`와 동일하다 — 앵커 셀에서 시작해 포인터가 올라간 셀까지,
 * 시작 셀 상태로 페인트 모드를 고정한다. **다른 점은 기하뿐**이다:
 * 캘린더는 앵커~현재의 연속 구간(1D), 그리드는 사각형(2D).
 */
export function AvailabilityTimeGrid({
  columns,
  rows,
  value,
  onChange,
  disabledKeys,
  disabled = false,
  onSelectionStart,
  className,
}: AvailabilityTimeGridProps): React.JSX.Element {
  const disabledKeySet = disabledKeys ?? EMPTY_KEYS;

  const [gridElement, setGridElement] = React.useState<HTMLDivElement | null>(null);
  const drag = useCellDragSelect({ value, disabledKeys: disabledKeySet, onChange });
  const autoScroll = useEdgeAutoScroll(gridElement);

  // 드래그 시작 위치
  const anchorRef = React.useRef<string | null>(null);

  // 드래그가 시작했는지 저장
  const isDragStartedRef = React.useRef(false);

  // 드래그 뒤의 click 이벤트를 무시하기 위해, 드래그가 끝나면 true로 바꾸고 setTimeout으로 0ms 뒤 초기화
  const suppressClickRef = React.useRef(false);

  /**
   * 터치 제스처 판정 상태.
   *
   * 손가락 하나로 스크롤과 선택을 모두 해야 해서, 누른 직후에는 무엇인지 확정하지 않는다.
   * 이동 방향으로는 나눌 수 없다 — 선택도 스크롤도 가로·세로를 모두 쓰기 때문이다.
   */
  const touchRef = React.useRef<{
    phase: 'pending' | 'scrolling' | 'selecting';
    timerId: number;
  } | null>(null);

  // 드래그 중이면 true. 롱프레스 후 선택 모드에 들어가면 true. 아니면 false.
  const isSelectingRef = React.useRef(false);

  const clearTouchTimer = () => {
    if (touchRef.current) window.clearTimeout(touchRef.current.timerId);
  };

  const resetTouch = () => {
    clearTouchTimer();
    touchRef.current = null;
    isSelectingRef.current = false;
  };

  const handleTouchScrollStart = React.useCallback(() => {
    const touch = touchRef.current;
    if (!touch || touch.phase !== 'pending') return;

    window.clearTimeout(touch.timerId);
    touch.phase = 'scrolling';
  }, []);

  const axisLockedScroll = useAxisLockedTouchScroll(gridElement, {
    onScrollStart: handleTouchScrollStart,
  });

  // 드래그 중에는 미리보기를 그린다. 커밋 전에도 화면이 바로 반응한다.
  const selectedKeys = React.useMemo(() => new Set(drag.previewValue), [drag.previewValue]);

  /**
   * 선택 모드에서만 브라우저 스크롤을 막는다.
   *
   * `touch-action`은 제스처가 시작될 때 확정돼서 도중에 바꿔도 이미 시작된 제스처엔 안 먹는다.
   * 대신 롱프레스 시점엔 손가락이 멈춰 있어 스크롤이 아직 시작되지 않았으므로,
   * 그때부터 `preventDefault`로 막을 수 있다. 단 리스너가 passive가 아니어야 해서 직접 붙인다.
   */
  React.useEffect(() => {
    if (!gridElement) return;

    const blockScrollWhileSelecting = (event: TouchEvent) => {
      if (isSelectingRef.current) event.preventDefault();
    };

    gridElement.addEventListener('touchmove', blockScrollWhileSelecting, { passive: false });
    return () => gridElement.removeEventListener('touchmove', blockScrollWhileSelecting);
  }, [gridElement]);

  // 셀 진입 공통 처리 — 마우스(pointerenter)와 터치 좌표 매핑(pointermove)이 공유한다.
  const enterCell = (key: string) => {
    if (disabled) return;

    const anchor = anchorRef.current;
    if (!anchor) return;

    if (!isDragStartedRef.current) {
      if (key === anchor) return; // 시작 전 + 같은 셀 = 탭 → 개입하지 않는다
      drag.start(anchor);
      isDragStartedRef.current = true;
    }

    drag.update(buildRectCellKeys({ anchorKey: anchor, currentKey: key, columns, rows }));
  };

  const handlePointerDown = (e: React.PointerEvent, key: string) => {
    if (disabled) return;

    // 아직 드래그를 시작하지 않는다 — anchor만 기록한다(탭이면 pointer 경로 미개입).
    anchorRef.current = key;
    isDragStartedRef.current = false;

    // 마우스는 지금까지처럼 즉시 드래그한다. 휠·스크롤바가 따로 있어 충돌하지 않는다.
    if (e.pointerType !== 'touch') return;

    const target = e.currentTarget;
    const pointerId = e.pointerId;

    touchRef.current = {
      phase: 'pending',
      timerId: window.setTimeout(() => {
        const touch = touchRef.current;
        if (!touch || touch.phase !== 'pending') return;

        touch.phase = 'selecting';
        isSelectingRef.current = true;
        axisLockedScroll.cancel();

        // 롱프레스 시점엔 손가락이 멈춰 있어 브라우저 스크롤이 아직 시작되지 않았다.
        // 그래서 이제부터 touchmove를 preventDefault 하면 스크롤을 막을 수 있다.
        // 시작 셀 밖으로 나가도 pointermove를 계속 받도록 캡처도 건다.
        if (typeof target.setPointerCapture === 'function') {
          target.setPointerCapture(pointerId);
        }
        onSelectionStart?.();
      }, LONG_PRESS_MS),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (axisLockedScroll.onPointerMove(e)) return;
    if (!anchorRef.current) return;

    const touch = touchRef.current;

    if (touch) {
      if (touch.phase !== 'selecting') return;
    }

    // 가장자리에 닿으면 스크롤을 굴린다(가로=그리드, 세로=바깥 스크롤 조상).
    autoScroll.track(e.clientX, e.clientY);

    const key = cellKeyFromPoint(e.clientX, e.clientY);
    if (key) enterCell(key);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const didScroll = axisLockedScroll.onPointerUp(e);

    if (isDragStartedRef.current) {
      drag.commit();
    }

    if (didScroll || isDragStartedRef.current) {
      suppressClickRef.current = true; // 드래그 뒤 같은 흐름의 click 무시
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    anchorRef.current = null;
    isDragStartedRef.current = false;
    resetTouch();
    autoScroll.stop();
  };

  // 드래그 취소 — 커밋 없이 되돌린다(그리드 밖으로 나가거나 OS가 제스처를 가져갈 때).
  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    axisLockedScroll.onPointerCancel(e);
    if (!anchorRef.current) return;

    drag.cancel();
    anchorRef.current = null;
    isDragStartedRef.current = false;
    resetTouch();
    autoScroll.stop();
  };

  // 탭은 누른 셀 하나를 앵커로 보는 드래그와 같다 — 모드 판정을 드래그와 공유한다.
  const handleCellClick = (key: string) => {
    if (disabled || suppressClickRef.current) return;

    const mode = getPaintMode(key, selectedKeys);
    onChange(applyCellSelection({ value, targets: [key], mode, disabledKeys: disabledKeySet }));
  };

  return (
    // 한 손가락 팬은 최초 우세 축으로 잠그고 직접 관성을 적용한다.
    // 셀 롱프레스가 먼저 성립하면 스크롤을 취소하고 2D 선택으로 전환한다.
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div
        ref={setGridElement}
        data-time-grid-scroll
        className={'relative -mr-5 -mb-10 min-h-0 flex-1 overflow-auto overscroll-none select-none'}
        style={{ touchAction: 'pinch-zoom' }}
        onPointerDown={axisLockedScroll.onPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        // pointercancel은 OS/브라우저가 제스처를 가져간 상황이라 부분 선택을 커밋하면 안 된다.
        onPointerCancel={handlePointerCancel}
        // onPointerLeave로 취소하지 않는다 — 이 그리드는 스크롤 컨테이너라
        // 가장자리에 다가가는 것이 useEdgeAutoScroll의 트리거다. 경계에서 취소하면 둘이 충돌한다.
      >
        <div className="min-w-max">
          {/** 가로 헤더 */}
          <div data-time-grid-column-header-row className="sticky top-0 z-20 flex gap-1.5 bg-white">
            <div
              data-time-grid-corner
              className={cn(TIME_LABEL_WIDTH, 'sticky left-0 z-30 bg-white')}
            />
            {columns.map((date) => {
              const day = parseISO(date);

              // 가로 header cell
              return (
                <div
                  key={date}
                  data-time-grid-column-header={date}
                  className={cn(CELL_WIDTH, 'flex flex-col items-center gap-1.5 bg-white pb-3')}
                >
                  <span className="text-bold-14 text-neutral-500">
                    {format(day, 'EEE', { locale: ko })}
                  </span>
                  <span className="text-semibold-14 text-neutral-850">{format(day, 'M/d')}</span>
                </div>
              );
            })}
          </div>

          {rows.map((time) => (
            <div key={time} className="flex gap-1.5 pr-5 pb-1.5">
              {/** 세로 header cell */}
              <div
                data-time-grid-row-header={time}
                className={cn(
                  TIME_LABEL_WIDTH,
                  'sticky left-0 z-10 flex items-center justify-center bg-white text-semibold-14 text-neutral-850'
                )}
              >
                {time}
              </div>

              {columns.map((date) => {
                const key = toCellKey(date, time);
                const state = getCellState(key, selectedKeys, disabledKeySet);

                return (
                  <button
                    key={key}
                    type="button"
                    data-cell-key={key}
                    aria-label={formatCellLabel(date, time)}
                    aria-pressed={state === 'selected'}
                    disabled={state === 'disabled'}
                    onPointerDown={(e) => handlePointerDown(e, key)}
                    onPointerEnter={() => enterCell(key)}
                    onClick={() => handleCellClick(key)}
                    className={cn(CELL_WIDTH, 'h-10 rounded-4', CELL_STATE_CLASS[state])}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
