import { describe, it, expect } from 'vitest';

import { toServiceDate } from './to-service-date';

describe('toServiceDate', () => {
  it("should return '2026-07-26' when serverTime is '2026-07-25T15:30:00Z'", () => {
    expect(toServiceDate('2026-07-25T15:30:00Z')).toBe('2026-07-26');
  });

  it("should return '2026-07-25' when serverTime is '2026-07-25T00:00:00Z'", () => {
    expect(toServiceDate('2026-07-25T00:00:00Z')).toBe('2026-07-25');
  });

  it("should return '2026-07-26' when serverTime is '2026-07-25T15:00:00Z' (KST 자정 정각)", () => {
    expect(toServiceDate('2026-07-25T15:00:00Z')).toBe('2026-07-26');
  });

  it("should return '2026-07-25' when serverTime is '2026-07-25T14:59:59Z' (KST 자정 1초 전)", () => {
    expect(toServiceDate('2026-07-25T14:59:59Z')).toBe('2026-07-25');
  });

  it('should return null when serverTime is undefined', () => {
    expect(toServiceDate(undefined)).toBeNull();
  });

  it("should return null when serverTime is 'not-a-date'", () => {
    expect(toServiceDate('not-a-date')).toBeNull();
  });

  it('should return null when serverTime is an empty string', () => {
    expect(toServiceDate('')).toBeNull();
  });
});
