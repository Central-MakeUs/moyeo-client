import { describe, expect, it } from 'vitest';

import { isDraftUsableFor, isValidGuestPassword } from './validate-guest-identity';

describe('isValidGuestPassword', () => {
  it('숫자 네 자리는 유효하다', () => {
    expect(isValidGuestPassword('1234')).toBe(true);
  });

  it.each(['123', '12345', '12a4'])('%s는 유효하지 않다', (password) => {
    expect(isValidGuestPassword(password)).toBe(false);
  });
});

describe('isDraftUsableFor', () => {
  it('초안의 inviteToken이 현재 토큰과 같으면 true다', () => {
    const identity = { inviteToken: 'ABC123', nickname: '소미', password: '1234' };

    expect(isDraftUsableFor(identity, 'ABC123')).toBe(true);
  });

  it('초안이 없으면 false다', () => {
    expect(isDraftUsableFor(null, 'ABC123')).toBe(false);
  });

  it('초안의 inviteToken이 다른 모임이면 false다', () => {
    const identity = { inviteToken: 'OLD123', nickname: '소미', password: '1234' };

    expect(isDraftUsableFor(identity, 'ABC123')).toBe(false);
  });
});
