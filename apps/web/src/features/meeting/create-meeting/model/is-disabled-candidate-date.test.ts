import { describe, it, expect } from 'vitest';

import { isDisabledCandidateDate } from './is-disabled-candidate-date';

describe('isDisabledCandidateDate', () => {
  it('어제는 고를 수 없다', () => {
    expect(isDisabledCandidateDate(new Date(2026, 6, 9), '2026-07-10')).toBe(true);
  });

  it('오늘은 고를 수 없다', () => {
    expect(isDisabledCandidateDate(new Date(2026, 6, 10), '2026-07-10')).toBe(true);
  });

  it('내일부터 고를 수 있다', () => {
    expect(isDisabledCandidateDate(new Date(2026, 6, 11), '2026-07-10')).toBe(false);
  });

  it('달이 바뀌어도 날짜 순서대로 판정한다', () => {
    expect(isDisabledCandidateDate(new Date(2026, 7, 1), '2026-07-31')).toBe(false);
    expect(isDisabledCandidateDate(new Date(2026, 6, 31), '2026-08-01')).toBe(true);
  });
});
