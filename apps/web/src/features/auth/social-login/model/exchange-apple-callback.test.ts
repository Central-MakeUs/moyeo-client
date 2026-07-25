import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  getToken,
  postAppleLogin,
  readOAuthTransaction,
  saveOAuthTransaction,
} from '@/entities/auth';

import { exchangeAppleCallback } from './exchange-apple-callback';

vi.mock('@/entities/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/auth')>();
  return { ...actual, postAppleLogin: vi.fn() };
});

const APPLE_RESPONSE = {
  accessToken: 'jwt',
  tokenType: 'Bearer',
  user: { id: 1, nickname: null, onboardingCompleted: false },
};

describe('exchangeAppleCallback', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(postAppleLogin).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call postAppleLogin with {code, nonce} when state matches', async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });
    vi.mocked(postAppleLogin).mockResolvedValue(APPLE_RESPONSE);

    await exchangeAppleCallback({ code: 'xxx', state: 'abc' });

    expect(postAppleLogin).toHaveBeenCalledWith({ code: 'xxx', nonce: 'n1' });
  });

  it("should set token and return success redirectTo '/nickname' when onboardingCompleted is false", async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });
    vi.mocked(postAppleLogin).mockResolvedValue(APPLE_RESPONSE);

    const result = await exchangeAppleCallback({ code: 'xxx', state: 'abc' });

    expect(getToken()).toBe('jwt');
    expect(result).toEqual({ status: 'success', redirectTo: '/nickname' });
  });

  it("should return redirectTo '/home' when onboardingCompleted is true", async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });
    vi.mocked(postAppleLogin).mockResolvedValue({
      ...APPLE_RESPONSE,
      user: { id: 1, nickname: 'moyeo', onboardingCompleted: true },
    });

    const result = await exchangeAppleCallback({ code: 'xxx', state: 'abc' });

    expect(result).toEqual({ status: 'success', redirectTo: '/home' });
  });

  it('should clear the oauth transaction on success', async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });
    vi.mocked(postAppleLogin).mockResolvedValue(APPLE_RESPONSE);

    await exchangeAppleCallback({ code: 'xxx', state: 'abc' });

    expect(readOAuthTransaction()).toBeNull();
  });

  it('should return state_mismatch error and not call postAppleLogin when state differs', async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });

    const result = await exchangeAppleCallback({ code: 'xxx', state: 'zzz' });

    expect(result).toEqual({ status: 'error', reason: 'state_mismatch' });
    expect(postAppleLogin).not.toHaveBeenCalled();
  });

  it('should return no_code error and not call postAppleLogin when code is null', async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });

    const result = await exchangeAppleCallback({ code: null, state: 'abc' });

    expect(result).toEqual({ status: 'error', reason: 'no_code' });
    expect(postAppleLogin).not.toHaveBeenCalled();
  });

  it('should return cancelled error and not call postAppleLogin when error param is present', async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });

    const result = await exchangeAppleCallback({
      code: null,
      state: 'abc',
      error: 'user_cancelled_authorize',
    });

    expect(result).toEqual({ status: 'error', reason: 'cancelled' });
    expect(postAppleLogin).not.toHaveBeenCalled();
  });

  it('should return request_failed error when postAppleLogin rejects', async () => {
    saveOAuthTransaction({ provider: 'apple', state: 'abc', nonce: 'n1' });
    vi.mocked(postAppleLogin).mockRejectedValue(new Error('network'));

    const result = await exchangeAppleCallback({ code: 'xxx', state: 'abc' });

    expect(result).toEqual({ status: 'error', reason: 'request_failed' });
  });
});
