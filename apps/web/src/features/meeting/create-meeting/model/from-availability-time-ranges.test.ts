import { describe, it, expect } from 'vitest';

import { fromAvailabilityTimeRanges } from './from-availability-time-ranges';

describe('fromAvailabilityTimeRanges', () => {
  it("should return ['2026-07-10 18:00','2026-07-10 19:00'] when the range is 18:00~20:00", () => {
    expect(
      fromAvailabilityTimeRanges([
        { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
      ])
    ).toEqual(['2026-07-10 18:00', '2026-07-10 19:00']);
  });

  it('should return [] when given []', () => {
    expect(fromAvailabilityTimeRanges([])).toEqual([]);
  });

  it('should exclude the end time from the produced cell keys', () => {
    const keys = fromAvailabilityTimeRanges([
      { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
    ]);

    expect(keys).not.toContain('2026-07-10 20:00');
  });

  it('should produce no cell keys when endTime is not after startTime', () => {
    expect(
      fromAvailabilityTimeRanges([
        { candidateDate: '2026-07-10', startTime: '20:00', endTime: '18:00' },
      ])
    ).toEqual([]);
  });
});
