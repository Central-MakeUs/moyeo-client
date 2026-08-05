import { parseCellKey, toCellKey } from './cell-key';

export interface BuildRectCellKeysParams {
  /** 드래그를 시작한 셀 키. */
  anchorKey: string;
  /** 지금 포인터가 올라간 셀 키. */
  currentKey: string;
  /** 그리드 열(날짜) 순서. */
  columns: string[];
  /** 그리드 행(시각) 순서. */
  rows: string[];
}

/** 셀 키 → (열 index, 행 index). 그리드 밖이면 null. */
function toCellIndex(
  key: string,
  columns: string[],
  rows: string[]
): { column: number; row: number } | null {
  const parts = parseCellKey(key);
  if (!parts) return null;

  const column = columns.indexOf(parts.date);
  const row = rows.indexOf(parts.time);
  if (column === -1 || row === -1) return null;

  return { column, row };
}

/**
 * 앵커와 현재 셀이 만드는 **사각형** 안의 모든 셀 키.
 * 캘린더(1D 연속 구간)와 달리 시간 그리드는 열을 넘는 2D 선택이다.
 * 둘 중 하나라도 그리드 밖이면 [].
 */
export function buildRectCellKeys({
  anchorKey,
  currentKey,
  columns,
  rows,
}: BuildRectCellKeysParams): string[] {
  const anchor = toCellIndex(anchorKey, columns, rows);
  const current = toCellIndex(currentKey, columns, rows);
  if (!anchor || !current) return [];

  const [columnFrom, columnTo] = [anchor.column, current.column].sort((a, b) => a - b);
  const [rowFrom, rowTo] = [anchor.row, current.row].sort((a, b) => a - b);

  const keys: string[] = [];

  for (let column = columnFrom!; column <= columnTo!; column += 1) {
    for (let row = rowFrom!; row <= rowTo!; row += 1) {
      keys.push(toCellKey(columns[column]!, rows[row]!));
    }
  }

  return keys;
}
