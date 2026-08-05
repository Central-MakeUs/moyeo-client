import { describe, it, expect } from 'vitest';

import { formatScheduleCandidateDates } from './format-schedule-candidate-dates';
import { parseScheduleCandidateDates } from './parse-schedule-candidate-dates';

describe('parseScheduleCandidateDates', () => {
  it('should return Date objects for 2026-07-10 and 2026-07-11 when given those ISO strings', () => {
    expect(parseScheduleCandidateDates(['2026-07-10', '2026-07-11'])).toEqual([
      new Date(2026, 6, 10),
      new Date(2026, 6, 11),
    ]);
  });

  it('should return [] when given []', () => {
    expect(parseScheduleCandidateDates([])).toEqual([]);
  });

  it('should round-trip to the same ISO array when passed through formatScheduleCandidateDates', () => {
    const iso = ['2026-07-10', '2026-07-11', '2026-08-01'];

    expect(formatScheduleCandidateDates(parseScheduleCandidateDates(iso))).toEqual(iso);
  });
});
