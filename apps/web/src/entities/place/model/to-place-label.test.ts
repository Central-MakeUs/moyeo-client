import { describe, it, expect } from 'vitest';

import { toPlaceLabel } from './to-place-label';

describe('toPlaceLabel', () => {
  it('displayName이 있으면 displayName을 반환한다', () => {
    expect(toPlaceLabel({ displayName: '강남역', address: '서울 강남구' })).toBe('강남역');
  });

  it('displayName이 없으면 address를 반환한다', () => {
    expect(toPlaceLabel({ address: '서울 강남구' })).toBe('서울 강남구');
  });

  it('둘 다 없으면 빈 문자열을 반환한다', () => {
    expect(toPlaceLabel({})).toBe('');
  });
});
