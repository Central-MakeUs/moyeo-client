import { describe, it, expect } from 'vitest';

import { buildCellKeysBeforeDate } from './build-cell-keys-before-date';

const COLUMNS = ['2026-07-09', '2026-07-10', '2026-07-11'];
const ROWS = ['18:00', '19:00'];

describe('buildCellKeysBeforeDate', () => {
  it('should contain every cell of 2026-07-09 when serverToday is 2026-07-10', () => {
    const keys = buildCellKeysBeforeDate(COLUMNS, ROWS, '2026-07-10');

    expect(keys.has('2026-07-09 18:00')).toBe(true);
    expect(keys.has('2026-07-09 19:00')).toBe(true);
    expect(keys.size).toBe(2);
  });

  // ⚠️ 날짜 단위 판정만 한다. 오늘 열의 지난 시간대는 아직 막지 않는다(#120).
  it('모든 열이 serverToday 이후면 오늘 열의 지난 시간대까지 열어둔 채 빈 집합을 반환한다', () => {
    expect(buildCellKeysBeforeDate(['2026-07-10', '2026-07-11'], ROWS, '2026-07-10').size).toBe(0);
  });
});
