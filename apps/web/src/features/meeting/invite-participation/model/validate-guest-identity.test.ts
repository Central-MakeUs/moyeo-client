import { describe, expect, it } from 'vitest';

import { isValidGuestNickname, isValidGuestPassword } from './validate-guest-identity';

describe('isValidGuestNickname', () => {
  it.each(['소미', 'moyeo', '모여Moyeo'])('%s는 유효하다', (nickname) => {
    expect(isValidGuestNickname(nickname)).toBe(true);
  });

  it.each(['소', '소미1', '소 미', 'abcdefghijk'])('%s는 유효하지 않다', (nickname) => {
    expect(isValidGuestNickname(nickname)).toBe(false);
  });
});

describe('isValidGuestPassword', () => {
  it('숫자 네 자리는 유효하다', () => {
    expect(isValidGuestPassword('1234')).toBe(true);
  });

  it.each(['123', '12345', '12a4'])('%s는 유효하지 않다', (password) => {
    expect(isValidGuestPassword(password)).toBe(false);
  });
});
