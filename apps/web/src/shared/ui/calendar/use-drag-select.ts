import { useReducer, useRef } from 'react';
import { eachDayOfInterval, isSameDay } from 'date-fns';

/** 드래그 페인트 모드 — 시작(anchor) 셀 상태로 결정되어 제스처 동안 고정된다. */
export type PaintMode = 'select' | 'deselect';

export interface UseDragSelectParams {
  /** 현재 선택 집합(제어). 페인트 모드 판정과 커밋의 기준. */
  value: Date[];
  /** 비활성 판정. 드래그 범위에 들어와도 결과에서 제외한다. 미주입 시 전부 활성. */
  isDateDisabled?: (date: Date) => boolean;
  /** 최대 선택 가능 일수(개수). 미주입=무제한. 초과 드래그는 anchor부터 채우고 나머지를 자른다. */
  maxSelectedDays?: number;
  /** 드래그 커밋이 개수 제한으로 잘리면 제스처당 1회 호출(토스트 트리거). */
  onLimitExceeded?: () => void;
}

export interface UseDragSelectResult {
  /** 드래그 진행 중 여부. */
  isDragging: boolean;
  /** 렌더용 선택 집합. 드래그 중=페인트 미리보기 적용값, 아니면 value 그대로. */
  previewValue: Date[];
  /** pointerdown — anchor 셀 상태로 페인트 모드 결정, 드래그 시작. */
  start: (day: Date) => void;
  /** pointerenter — 현재 셀 갱신. anchor~current 연속 날짜가 이번 드래그 대상. */
  enter: (day: Date) => void;
  /** pointerup — 페인트를 적용한 다음 선택 집합(불변 새 배열)을 반환한다. */
  commit: () => Date[];
  /** 드래그 취소 — 커밋 없이 상태를 되돌린다. onChange 없음, previewValue는 value로 복귀. */
  cancel: () => void;
}

const includesDate = (dates: Date[], day: Date) => dates.some((x) => isSameDay(x, day));

export function useDragSelect({
  value,
  isDateDisabled,
  maxSelectedDays,
  onLimitExceeded,
}: UseDragSelectParams): UseDragSelectResult {
  // anchor/current는 ref — 같은 pointer 제스처(down→up) 안에서 동기적으로 읽어야 하므로
  // state 대신 ref를 쓴다(핸들러 stale closure 회피). 미리보기 재렌더는 forceRender로 유발.
  const anchorRef = useRef<Date | null>(null);
  const currentRef = useRef<Date | null>(null);
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  const isDragging = anchorRef.current !== null;

  // anchor→current 방향의 연속 활성 날짜(비활성 제외). anchor가 배열 앞(먼저 채워지는 쪽).
  const paintRangeFromAnchor = (): Date[] => {
    const anchor = anchorRef.current;
    const current = currentRef.current;
    if (!anchor || !current) return [];
    const isForward = anchor <= current;
    const [lo, hi] = isForward ? [anchor, current] : [current, anchor];
    const asc = eachDayOfInterval({ start: lo, end: hi }).filter((day) => !isDateDisabled?.(day));
    return isForward ? asc : asc.reverse();
  };

  // select 페인트: value ∪ 범위. 단, 전체 개수 ≤ maxSelectedDays.
  // anchor에서 먼 쪽부터 자르며, 실제로 새 날짜를 못 넣었으면 clamped=true.
  const applySelect = (): { next: Date[]; clamped: boolean } => {
    const next = [...value];
    let clamped = false;
    for (const day of paintRangeFromAnchor()) {
      if (includesDate(next, day)) continue; // 이미 선택 → 개수 안 늘어남
      if (maxSelectedDays !== undefined && next.length >= maxSelectedDays) {
        clamped = true; // 예산 소진 후의 새 날짜 → 잘림
        continue;
      }
      next.push(day);
    }
    return { next, clamped };
  };

  // 페인트 적용: select=개수 제한하며 합집합, deselect=value − 범위(제한 없음).
  const applyPaint = (): { next: Date[]; clamped: boolean } => {
    const anchor = anchorRef.current;
    const mode: PaintMode = anchor !== null && includesDate(value, anchor) ? 'deselect' : 'select';
    if (mode === 'deselect') {
      const range = paintRangeFromAnchor();
      return { next: value.filter((v) => !includesDate(range, v)), clamped: false };
    }
    return applySelect();
  };

  const start = (day: Date) => {
    anchorRef.current = day;
    currentRef.current = day;
    forceRender();
  };

  const enter = (day: Date) => {
    if (anchorRef.current !== null) {
      currentRef.current = day;
      forceRender();
    }
  };

  // 드래그 상태 초기화(재렌더 포함) — commit/cancel 공통.
  const reset = () => {
    anchorRef.current = null;
    currentRef.current = null;
    forceRender();
  };

  const commit = (): Date[] => {
    const { next, clamped } = applyPaint();
    if (clamped) onLimitExceeded?.();
    reset();
    return next;
  };

  // 취소 = 커밋 없이 상태만 초기화.
  const cancel = reset;

  const previewValue = isDragging ? applyPaint().next : value;

  return { isDragging, previewValue, start, enter, commit, cancel };
}
