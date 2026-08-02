import { describe, it, expect } from 'vitest';

import { getLineColor, FALLBACK_LINE_COLOR, SUBWAY_LINE_COLORS } from './subway-line-colors';

describe('getLineColor', () => {
  it('매핑에 있는 노선이면 지정된 색을 반환한다', () => {
    expect(getLineColor('2호선')).toBe(SUBWAY_LINE_COLORS['2호선']);
    expect(getLineColor('경의중앙선')).toBe(SUBWAY_LINE_COLORS['경의중앙선']);
  });

  it('매핑에 없는 노선이면 기본색을 반환한다', () => {
    expect(getLineColor('알수없는노선')).toBe(FALLBACK_LINE_COLOR);
  });
});
