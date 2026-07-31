import { describe, it, expect } from 'vitest';

import { isBeforeServerToday } from './is-before-server-today';

describe('isBeforeServerToday', () => {
  it("should return true when date is 2026-07-09 and serverToday is '2026-07-10'", () => {
    expect(isBeforeServerToday(new Date(2026, 6, 9), '2026-07-10')).toBe(true);
  });

  it("should return false when date is 2026-07-10 and serverToday is '2026-07-10'", () => {
    expect(isBeforeServerToday(new Date(2026, 6, 10), '2026-07-10')).toBe(false);
  });

  it("should return false when date is 2026-07-11 and serverToday is '2026-07-10'", () => {
    expect(isBeforeServerToday(new Date(2026, 6, 11), '2026-07-10')).toBe(false);
  });
});
