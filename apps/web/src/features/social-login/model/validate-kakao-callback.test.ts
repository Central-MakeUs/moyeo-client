import { describe, it, expect } from 'vitest';

import { validateKakaoCallback } from './validate-kakao-callback';

const TRANSACTION = { provider: 'kakao' as const, state: 'abc' };

describe('validateKakaoCallback', () => {
  it('should return ready with code when state matches and code exists', () => {
    expect(validateKakaoCallback({ code: 'xxx', state: 'abc' }, TRANSACTION)).toEqual({
      status: 'ready',
      code: 'xxx',
    });
  });

  it('should return state_mismatch error when there is no transaction', () => {
    expect(validateKakaoCallback({ code: 'xxx', state: 'abc' }, null)).toEqual({
      status: 'error',
      reason: 'state_mismatch',
    });
  });

  it('should return cancelled error when the error param is present', () => {
    expect(
      validateKakaoCallback({ code: null, state: 'abc', error: 'access_denied' }, TRANSACTION)
    ).toEqual({ status: 'error', reason: 'cancelled' });
  });

  it('should return state_mismatch error when state differs from the transaction', () => {
    expect(validateKakaoCallback({ code: 'xxx', state: 'zzz' }, TRANSACTION)).toEqual({
      status: 'error',
      reason: 'state_mismatch',
    });
  });

  it('should return no_code error when code is null and state matches', () => {
    expect(validateKakaoCallback({ code: null, state: 'abc' }, TRANSACTION)).toEqual({
      status: 'error',
      reason: 'no_code',
    });
  });
});
