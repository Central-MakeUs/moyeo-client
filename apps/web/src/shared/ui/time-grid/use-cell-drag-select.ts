'use client';

import { useReducer, useRef } from 'react';

import { applyCellSelection, type PaintMode } from './apply-cell-selection';
import { getPaintMode } from './get-paint-mode';

export interface UseCellDragSelectParams {
  /** 현재 선택 집합(제어). 페인트 모드 판정과 커밋의 기준. */
  value: string[];
  /** 비활성 셀. 드래그 경로에 들어와도 결과에서 제외한다. */
  disabledKeys?: ReadonlySet<string>;
  /** 커밋 시 호출. 다음 선택 집합(불변 새 배열)을 넘긴다. */
  onChange: (next: string[]) => void;
}

export interface UseCellDragSelectResult {
  /** 드래그 진행 중 여부. */
  isDragging: boolean;
  /** 렌더용 선택 집합. 드래그 중이면 미리보기, 아니면 value 그대로. */
  previewValue: string[];
  /** 드래그 시작 — 앵커 셀 상태로 페인트 모드를 고정한다. */
  start: (anchorKey: string) => void;
  /** 현재 걸린 셀 목록 갱신. 제스처 동안 여러 번 호출된다. */
  update: (targetKeys: string[]) => void;
  /** 드래그 종료 — onChange로 결과를 커밋한다. */
  commit: () => void;
  /** 드래그 취소 — 커밋 없이 previewValue를 value로 되돌린다. */
  cancel: () => void;
}

/**
 * 시간 그리드 드래그 페인트. 포인터 이벤트를 모르고
 * "앵커에서 시작해 지금 이 셀들이 걸렸다"는 사실만 받는다.
 * 덕분에 제스처 전 경로를 renderHook으로 검증할 수 있다.
 */
export function useCellDragSelect({
  value,
  disabledKeys,
  onChange,
}: UseCellDragSelectParams): UseCellDragSelectResult {
  // 같은 제스처(start→commit) 안에서 동기적으로 읽어야 하므로 state 대신 ref를 쓴다.
  // 미리보기 재렌더는 forceRender로 유발한다.
  const modeRef = useRef<PaintMode | null>(null);
  const baseRef = useRef<string[]>([]);
  const targetsRef = useRef<string[]>([]);
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  const isDragging = modeRef.current !== null;

  // 드래그 시작 시점의 선택 집합(base)에 이번 제스처의 대상을 한 번에 적용한다.
  const paint = () =>
    applyCellSelection({
      value: baseRef.current,
      targets: targetsRef.current,
      mode: modeRef.current ?? 'select',
      disabledKeys,
    });

  const start = (anchorKey: string) => {
    modeRef.current = getPaintMode(anchorKey, new Set(value));
    baseRef.current = value;
    targetsRef.current = [];
    forceRender();
  };

  const update = (targetKeys: string[]) => {
    if (modeRef.current === null) return; // start 없이 온 호출은 무시한다

    targetsRef.current = targetKeys;
    forceRender();
  };

  const reset = () => {
    modeRef.current = null;
    baseRef.current = [];
    targetsRef.current = [];
    forceRender();
  };

  const commit = () => {
    if (modeRef.current === null) return;

    const next = paint();
    reset();
    onChange(next);
  };

  return {
    isDragging,
    previewValue: isDragging ? paint() : value,
    start,
    update,
    commit,
    cancel: reset,
  };
}
