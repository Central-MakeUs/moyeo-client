export interface CellKeyParts {
  /** 'yyyy-MM-dd' */
  date: string;
  /** 'HH:mm' */
  time: string;
}

/** 'yyyy-MM-dd HH:mm' 형식만 유효한 셀 키로 본다. */
const CELL_KEY_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/;

/** (날짜, 시각) → 셀 키 'yyyy-MM-dd HH:mm'. */
export function toCellKey(date: string, time: string): string {
  return `${date} ${time}`;
}

/** 셀 키 → 조각. 형식이 어긋나면 null. */
export function parseCellKey(key: string): CellKeyParts | null {
  const matched = CELL_KEY_PATTERN.exec(key);
  if (!matched) return null;

  const [, date, time] = matched;
  if (!date || !time) return null;

  return { date, time };
}
