/** 드래그 페인트 모드. 탭은 셀 상태에 따라 컴포넌트가 정한다. */
export type PaintMode = 'select' | 'deselect';

export interface ApplyCellSelectionParams {
  /** 현재 선택 집합 (셀 키). */
  value: string[];
  /** 이번 동작의 대상 셀 키. */
  targets: string[];
  /** 'select'=모두 추가, 'deselect'=모두 제거. */
  mode: PaintMode;
  /** 비활성 셀. 어느 모드에서도 결과에 영향을 주지 않는다. */
  disabledKeys?: ReadonlySet<string>;
}

/**
 * 선택 계산. 비활성 셀은 제외하고, 오름차순 정렬된 새 배열을 반환한다.
 * 셀 키가 'yyyy-MM-dd HH:mm'이라 사전순 정렬이 곧 날짜·시간순이다.
 */
export function applyCellSelection({
  value,
  targets,
  mode,
  disabledKeys,
}: ApplyCellSelectionParams): string[] {
  const next = new Set(value);

  for (const key of targets) {
    if (disabledKeys?.has(key)) continue;

    if (mode === 'select') next.add(key);
    else next.delete(key);
  }

  return [...next].sort();
}
