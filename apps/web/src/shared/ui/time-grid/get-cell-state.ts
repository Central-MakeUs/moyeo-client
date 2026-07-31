/** 우선순위: disabled > selected > default (spec-fixed §6-3). */
export type CellState = 'disabled' | 'selected' | 'default';

/** 셀 상태 판정. disabled > selected > default 순으로 본다. */
export function getCellState(
  key: string,
  selected: ReadonlySet<string>,
  disabled: ReadonlySet<string>
): CellState {
  if (disabled.has(key)) return 'disabled';
  if (selected.has(key)) return 'selected';

  return 'default';
}
