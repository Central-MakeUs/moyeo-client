import { describe, it, expect } from 'vitest';

import { parseCellKey, toCellKey } from './cell-key';

describe('toCellKey', () => {
  it("should return '2026-07-10 18:00' when date is '2026-07-10' and time is '18:00'", () => {
    expect(toCellKey('2026-07-10', '18:00')).toBe('2026-07-10 18:00');
  });
});

describe('parseCellKey', () => {
  it("should return date '2026-07-10' and time '18:00' when key is '2026-07-10 18:00'", () => {
    expect(parseCellKey('2026-07-10 18:00')).toEqual({ date: '2026-07-10', time: '18:00' });
  });

  it("should return null when key is 'garbage'", () => {
    expect(parseCellKey('garbage')).toBeNull();
  });

  it('should return null when key has no time part', () => {
    expect(parseCellKey('2026-07-10')).toBeNull();
  });
});

describe('cellKey', () => {
  it('should round-trip to the same key when toCellKey output is parsed and rebuilt', () => {
    const key = toCellKey('2026-07-10', '18:00');
    const parts = parseCellKey(key);

    expect(parts).not.toBeNull();
    expect(toCellKey(parts!.date, parts!.time)).toBe(key);
  });
});
