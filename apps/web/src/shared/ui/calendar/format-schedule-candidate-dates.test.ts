import { describe, expect, it } from 'vitest';

import { formatScheduleCandidateDates } from './format-schedule-candidate-dates';

describe('formatScheduleCandidateDates', () => {
  it('should return ["2026-07-04", "2026-07-05"] when given [Date(2026-07-05), Date(2026-07-04)]', () => {
    const result = formatScheduleCandidateDates([new Date(2026, 6, 5), new Date(2026, 6, 4)]);

    expect(result).toEqual(['2026-07-04', '2026-07-05']);
  });

  it('should return [] when given []', () => {
    expect(formatScheduleCandidateDates([])).toEqual([]);
  });

  it('should return ["2026-07-05"] when given [Date(2026-07-05), Date(2026-07-05)] (중복 dedupe)', () => {
    const result = formatScheduleCandidateDates([new Date(2026, 6, 5), new Date(2026, 6, 5)]);

    expect(result).toEqual(['2026-07-05']);
  });
});
