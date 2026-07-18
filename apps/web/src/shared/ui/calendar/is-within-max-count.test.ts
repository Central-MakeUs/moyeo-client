import { describe, it, expect } from 'vitest';

import { isWithinMaxCount } from './is-within-max-count';

const d = (day: number) => new Date(2026, 6, day);
const dates = (count: number) => Array.from({ length: count }, (_, i) => d(i + 1));

describe('isWithinMaxCount', () => {
  it('should return true for 21 dates and false for 22 dates, maxCount=21', () => {
    expect(isWithinMaxCount(dates(21), 21)).toBe(true);
    expect(isWithinMaxCount(dates(22), 21)).toBe(false);
  });
});
