import { describe, it, expect } from 'vitest';

import { availabilityTimeRangesToCellKeys } from './availability-time-ranges-to-cell-keys';
import { cellKeysToAvailabilityTimeRanges } from './cell-keys-to-availability-time-ranges';

describe('cellKeysToAvailabilityTimeRanges', () => {
  it('should merge 18:00 and 19:00 into one range 18:00~20:00 when both are selected on 2026-07-10', () => {
    expect(cellKeysToAvailabilityTimeRanges(['2026-07-10 18:00', '2026-07-10 19:00'])).toEqual([
      { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
    ]);
  });

  it('should return two ranges 18:00~20:00 and 21:00~22:00 when 18:00, 19:00 and 21:00 are selected', () => {
    expect(
      cellKeysToAvailabilityTimeRanges(['2026-07-10 18:00', '2026-07-10 19:00', '2026-07-10 21:00'])
    ).toEqual([
      { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
      { candidateDate: '2026-07-10', startTime: '21:00', endTime: '22:00' },
    ]);
  });

  it('should order ranges by candidateDate ascending when two dates are selected', () => {
    const ranges = cellKeysToAvailabilityTimeRanges(['2026-07-11 09:00', '2026-07-10 18:00']);

    expect(ranges[0]?.candidateDate).toBe('2026-07-10');
    expect(ranges[1]?.candidateDate).toBe('2026-07-11');
  });

  it('should return a single one-hour range 18:00~19:00 when only 18:00 is selected', () => {
    expect(cellKeysToAvailabilityTimeRanges(['2026-07-10 18:00'])).toEqual([
      { candidateDate: '2026-07-10', startTime: '18:00', endTime: '19:00' },
    ]);
  });

  it('should return [] when given []', () => {
    expect(cellKeysToAvailabilityTimeRanges([])).toEqual([]);
  });

  it('should not merge across dates when 2026-07-10 23:00 and 2026-07-11 00:00 are selected', () => {
    expect(cellKeysToAvailabilityTimeRanges(['2026-07-10 23:00', '2026-07-11 00:00'])).toEqual([
      { candidateDate: '2026-07-10', startTime: '23:00', endTime: '24:00' },
      { candidateDate: '2026-07-11', startTime: '00:00', endTime: '01:00' },
    ]);
  });

  it("should ignore keys that are not in the 'yyyy-MM-dd HH:mm' format", () => {
    expect(cellKeysToAvailabilityTimeRanges(['garbage', '2026-07-10 18:00'])).toEqual([
      { candidateDate: '2026-07-10', startTime: '18:00', endTime: '19:00' },
    ]);
  });

  it('should round-trip to the same ranges when converted to cell keys and back', () => {
    const ranges = [
      { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
      { candidateDate: '2026-07-11', startTime: '09:00', endTime: '10:00' },
    ];

    expect(cellKeysToAvailabilityTimeRanges(availabilityTimeRangesToCellKeys(ranges))).toEqual(
      ranges
    );
  });
});
