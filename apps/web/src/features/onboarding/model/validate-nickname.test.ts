import { describe, it, expect } from 'vitest';

import { isValidNickname } from './validate-nickname';

describe('isValidNickname', () => {
  it("should return true when value is '모여nick' (한글+영어)", () => {
    expect(isValidNickname('모여nick')).toBe(true);
  });

  it("should return false when value is '' (빈 문자열)", () => {
    expect(isValidNickname('')).toBe(false);
  });

  it("should return false when value is '가' (1자)", () => {
    expect(isValidNickname('가')).toBe(false);
  });

  it("should return true when value is '가나' (2자)", () => {
    expect(isValidNickname('가나')).toBe(true);
  });

  it('should return true when value is 10 characters long', () => {
    expect(isValidNickname('가나다라마바사아자차')).toBe(true);
  });

  it('should return false when value is 11 characters long', () => {
    expect(isValidNickname('가나다라마바사아자차카')).toBe(false);
  });

  it("should return false when value is '모여123' (숫자 포함)", () => {
    expect(isValidNickname('모여123')).toBe(false);
  });

  it("should return false when value is 'nick!' (특수문자)", () => {
    expect(isValidNickname('nick!')).toBe(false);
  });

  it("should return false when value is '모 여' (중간 공백)", () => {
    expect(isValidNickname('모 여')).toBe(false);
  });
});
