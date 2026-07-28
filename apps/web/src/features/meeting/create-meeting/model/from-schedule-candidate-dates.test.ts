import { describe, it, expect } from 'vitest';

import { fromScheduleCandidateDates } from './from-schedule-candidate-dates';
import { toScheduleCandidateDates } from './to-schedule-candidate-dates';

describe('fromScheduleCandidateDates', () => {
  it('should return Date objects for 2026-07-10 and 2026-07-11 when given those ISO strings', () => {
    expect(fromScheduleCandidateDates(['2026-07-10', '2026-07-11'])).toEqual([
      new Date(2026, 6, 10),
      new Date(2026, 6, 11),
    ]);
  });

  it('should return [] when given []', () => {
    expect(fromScheduleCandidateDates([])).toEqual([]);
  });

  it('should round-trip to the same ISO array when passed through toScheduleCandidateDates', () => {
    const iso = ['2026-07-10', '2026-07-11', '2026-08-01'];

    expect(toScheduleCandidateDates(fromScheduleCandidateDates(iso))).toEqual(iso);
  });
});
