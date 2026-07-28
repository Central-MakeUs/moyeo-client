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
import { useCellDragSelect } from './use-cell-drag-select';
import { useEdgeAutoScroll } from './use-edge-auto-scroll';

/** 상태별 배경 토큰 (spec-fixed §6-3). 리터럴 클래스로 붙여야 상태 검증이 가능하다. */
const CELL_STATE_CLASS: Record<CellState, string> = {
  disabled: 'bg-neutral-0',
  // hover는 Tailwind v4에서 @media (hover: hover)로 컴파일된다 → 터치에선 적용되지 않는다.
  default: 'bg-neutral-10 hover:bg-accessible-50',
  selected: 'bg-accessible-100',
};

const TIME_LABEL_WIDTH = 'w-[52px] shrink-0';
const CELL_WIDTH = 'w-[60px] shrink-0';

/** disabledKeys 미주입 시 매 렌더 새 Set을 만들지 않도록 고정한다. */
const EMPTY_KEYS: ReadonlySet<string> = new Set<string>();

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
  className,
}: AvailabilityTimeGridProps): React.JSX.Element {
  const disabled = disabledKeys ?? EMPTY_KEYS;

  const [gridElement, setGridElement] = React.useState<HTMLDivElement | null>(null);
  const drag = useCellDragSelect({ value, disabledKeys: disabled, onChange });
  const autoScroll = useEdgeAutoScroll(gridElement);

  const anchorRef = React.useRef<string | null>(null);
  const isDragStartedRef = React.useRef(false);
  const suppressClickRef = React.useRef(false);

  // 드래그 중에는 미리보기를 그린다. 커밋 전에도 화면이 바로 반응한다.
  const selectedKeys = React.useMemo(() => new Set(drag.previewValue), [drag.previewValue]);

  // 셀 진입 공통 처리 — 마우스(pointerenter)와 터치 좌표 매핑(pointermove)이 공유한다.
  const enterCell = (key: string) => {
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
    // 아직 드래그를 시작하지 않는다 — anchor만 기록한다(탭이면 pointer 경로 미개입).
    anchorRef.current = key;
    isDragStartedRef.current = false;

    // 터치는 시작 셀에 포인터가 캡처돼 다른 셀 pointerenter가 안 뜬다 →
    // 캡처를 걸어 pointermove를 계속 받고 좌표로 셀을 해석한다.
    if (e.pointerType === 'touch' && typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!anchorRef.current) return;

    // 가장자리에 닿으면 스크롤을 굴린다(가로=그리드, 세로=바깥 스크롤 조상).
    autoScroll.track(e.clientX, e.clientY);

    const key = cellKeyFromPoint(e.clientX, e.clientY);
    if (key) enterCell(key);
  };

  const handlePointerUp = () => {
    if (isDragStartedRef.current) {
      drag.commit();
      suppressClickRef.current = true; // 드래그 뒤 같은 흐름의 click 무시
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    anchorRef.current = null;
    isDragStartedRef.current = false;
    autoScroll.stop();
  };

  // 탭은 누른 셀 하나를 앵커로 보는 드래그와 같다 — 모드 판정을 드래그와 공유한다.
  const handleCellClick = (key: string) => {
    if (suppressClickRef.current) return;

    const mode = getPaintMode(key, selectedKeys);
    onChange(applyCellSelection({ value, targets: [key], mode, disabledKeys: disabled }));
  };

  return (
    // 드래그 중 페이지가 함께 움직이지 않도록 그리드 위에서 스크롤 제스처를 막는다.
    // 대신 가장자리 자동 스크롤(useEdgeAutoScroll)이 이동을 담당한다.
    <div
      ref={setGridElement}
      className={cn('relative touch-none overflow-auto overscroll-none', className)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="min-w-max">
        <div data-time-grid-column-header-row className="sticky top-0 z-20 flex gap-1 bg-white">
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
                className={cn(CELL_WIDTH, 'flex flex-col items-center gap-0.5 bg-white pb-3')}
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
          <div key={time} className="flex gap-1.5 pb-1.5">
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
              const state = getCellState(key, selectedKeys, disabled);

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
  );
}
