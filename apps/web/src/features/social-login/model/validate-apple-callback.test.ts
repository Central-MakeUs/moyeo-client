import { describe, it, expect } from 'vitest';

import { validateAppleCallback } from './validate-apple-callback';

const TRANSACTION = { provider: 'apple' as const, state: 'abc', nonce: 'n1' };

describe('validateAppleCallback', () => {
  it('should return ready with code and nonce when state matches and code exists', () => {
    expect(validateAppleCallback({ code: 'xxx', state: 'abc' }, TRANSACTION)).toEqual({
      status: 'ready',
      code: 'xxx',
      nonce: 'n1',
    });
  });

  it("should return nonce '' when the transaction has no nonce", () => {
    expect(
      validateAppleCallback({ code: 'xxx', state: 'abc' }, { provider: 'apple', state: 'abc' })
    ).toEqual({ status: 'ready', code: 'xxx', nonce: '' });
  });

  it('should return cancelled error when the error param is present', () => {
    expect(
      validateAppleCallback(
        { code: null, state: 'abc', error: 'user_cancelled_authorize' },
        TRANSACTION
      )
    ).toEqual({ status: 'error', reason: 'cancelled' });
  });

  it('should return state_mismatch error when state differs from the transaction', () => {
    expect(validateAppleCallback({ code: 'xxx', state: 'zzz' }, TRANSACTION)).toEqual({
      status: 'error',
      reason: 'state_mismatch',
    });
  });

  it('should return state_mismatch error when there is no transaction', () => {
    expect(validateAppleCallback({ code: 'xxx', state: 'abc' }, null)).toEqual({
      status: 'error',
      reason: 'state_mismatch',
    });
  });

  it('should return no_code error when code is null and state matches', () => {
    expect(validateAppleCallback({ code: null, state: 'abc' }, TRANSACTION)).toEqual({
      status: 'error',
      reason: 'no_code',
    });
  });
});
