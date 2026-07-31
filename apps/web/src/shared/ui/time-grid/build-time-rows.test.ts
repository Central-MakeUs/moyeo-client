import { describe, it, expect } from 'vitest';

import { buildTimeRows } from './build-time-rows';

describe('buildTimeRows', () => {
  it("should return ['17:00','18:00','19:00','20:00','21:00','22:00'] when range is '17:00' to '23:00'", () => {
    expect(buildTimeRows('17:00', '23:00')).toEqual([
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
    ]);
  });

  it("should return ['09:00'] when range is '09:00' to '10:00'", () => {
    expect(buildTimeRows('09:00', '10:00')).toEqual(['09:00']);
  });

  it("should return [] when start and end are both '09:00'", () => {
    expect(buildTimeRows('09:00', '09:00')).toEqual([]);
  });

  it("should return [] when end '09:00' is earlier than start '18:00'", () => {
    expect(buildTimeRows('18:00', '09:00')).toEqual([]);
  });

  it("should return 23 rows when range is '00:00' to '23:00'", () => {
    expect(buildTimeRows('00:00', '23:00')).toHaveLength(23);
  });

  it("should return [] when start is 'abc'", () => {
    expect(buildTimeRows('abc', '10:00')).toEqual([]);
  });
});
