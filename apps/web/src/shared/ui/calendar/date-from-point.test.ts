import { describe, it, expect, vi, beforeEach } from 'vitest';

import { dateFromPoint } from './date-from-point';

// jsdom에는 elementFromPoint가 없어 직접 mock을 심는다(레이아웃이 없어 원래 null).
const elementFromPoint = vi.fn<(x: number, y: number) => Element | null>();

beforeEach(() => {
  elementFromPoint.mockReset();
  document.elementFromPoint = elementFromPoint;
});

describe('dateFromPoint', () => {
  it('should return Date(2026-07-13) when elementFromPoint returns a cell with data-date="2026-07-13"', () => {
    const cell = document.createElement('div');
    cell.setAttribute('data-date', '2026-07-13');
    elementFromPoint.mockReturnValue(cell);

    expect(dateFromPoint(10, 20)).toEqual(new Date(2026, 6, 13));
  });

  it('should return null when elementFromPoint returns null (셀 밖 좌표)', () => {
    elementFromPoint.mockReturnValue(null);

    expect(dateFromPoint(0, 0)).toBeNull();
  });

  it('should return null when the element under the point has no data-date (달력 밖 요소)', () => {
    const el = document.createElement('div');
    elementFromPoint.mockReturnValue(el);

    expect(dateFromPoint(5, 5)).toBeNull();
  });
});
