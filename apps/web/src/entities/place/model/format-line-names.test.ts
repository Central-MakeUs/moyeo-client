import { describe, it, expect } from 'vitest';

import { formatLineNames } from './format-line-names';

describe('formatLineNames', () => {
  it('숫자 노선 여러 개는 "N·M호선"으로 합친다', () => {
    expect(formatLineNames(['2호선', '6호선'])).toBe('2·6호선');
  });

  it('숫자 노선과 이름 노선이 섞이면 각자 이름을 유지하며 이어붙인다', () => {
    expect(formatLineNames(['2호선', '경의중앙선'])).toBe('2호선·경의중앙선');
  });

  it('숫자 노선 하나면 그대로 반환한다', () => {
    expect(formatLineNames(['9호선'])).toBe('9호선');
  });

  it('이름 노선만 있으면 그대로 이어붙인다', () => {
    expect(formatLineNames(['경의중앙선', '수인분당선'])).toBe('경의중앙선·수인분당선');
  });

  it('빈 배열이면 빈 문자열을 반환한다', () => {
    expect(formatLineNames([])).toBe('');
  });
});
