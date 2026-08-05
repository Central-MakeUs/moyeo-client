import { describe, it, expect } from 'vitest';

import { formatTravelTime } from './format-travel-time';

describe('formatTravelTime', () => {
  it('60분 미만이면 "N분"으로 반환한다', () => {
    expect(formatTravelTime(720)).toBe('12분');
    expect(formatTravelTime(45)).toBe('1분');
  });

  it('정확히 시간 단위면 "H시간"으로 반환한다', () => {
    expect(formatTravelTime(3600)).toBe('1시간');
  });

  it('시간과 분이 섞이면 "H시간 N분"으로 반환한다', () => {
    expect(formatTravelTime(5400)).toBe('1시간 30분');
  });
});
