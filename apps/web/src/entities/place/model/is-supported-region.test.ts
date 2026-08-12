import { describe, expect, it } from 'vitest';

import { isSupportedRegion } from './is-supported-region';

describe('isSupportedRegion', () => {
  it("'서울'을 넣으면 true를 반환한다", () => {
    expect(isSupportedRegion('서울')).toBe(true);
  });

  it("'경기'를 넣으면 true를 반환한다", () => {
    expect(isSupportedRegion('경기')).toBe(true);
  });

  it("'부산'을 넣으면 false를 반환한다", () => {
    expect(isSupportedRegion('부산')).toBe(false);
  });

  it("'서울특별시'와 '경기도'처럼 지원 지역명으로 시작하면 true를 반환한다", () => {
    expect(isSupportedRegion('서울특별시')).toBe(true);
    expect(isSupportedRegion('경기도')).toBe(true);
  });

  it('null을 넣으면 false를 반환한다', () => {
    // 지번 주소가 없어 지역을 판정할 수 없는 경우다. 통과시키지 않는다.
    expect(isSupportedRegion(null)).toBe(false);
  });

  it('빈 문자열을 넣으면 false를 반환한다', () => {
    expect(isSupportedRegion('')).toBe(false);
  });
});
