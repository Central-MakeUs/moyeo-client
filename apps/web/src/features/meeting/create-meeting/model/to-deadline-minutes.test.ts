import { describe, it, expect } from 'vitest';

import { toDeadlineMinutes } from './to-deadline-minutes';

describe('toDeadlineMinutes', () => {
  it('should return 1440 when called with (1, 0)', () => {
    expect(toDeadlineMinutes(1, 0)).toBe(1440);
  });

  it('should return 360 when called with (0, 6)', () => {
    expect(toDeadlineMinutes(0, 6)).toBe(360);
  });

  it('should return 4320 when called with (3, 0)', () => {
    expect(toDeadlineMinutes(3, 0)).toBe(4320);
  });
});
