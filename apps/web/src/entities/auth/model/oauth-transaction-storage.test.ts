import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  clearOAuthTransaction,
  readOAuthTransaction,
  saveOAuthTransaction,
} from './oauth-transaction-storage';
import type { OAuthTransaction } from './types';

describe('oauth transaction storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the same transaction when reading after saving', () => {
    const transaction: OAuthTransaction = { provider: 'apple', state: 's1', nonce: 'n1' };
    saveOAuthTransaction(transaction);
    expect(readOAuthTransaction()).toEqual(transaction);
  });

  it('should return null when reading after clearing', () => {
    saveOAuthTransaction({ provider: 'apple', state: 's1', nonce: 'n1' });
    clearOAuthTransaction();
    expect(readOAuthTransaction()).toBeNull();
  });

  it('should return null when no transaction is stored', () => {
    expect(readOAuthTransaction()).toBeNull();
  });

  it('should return null without throwing when the stored value is not parseable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{not-json');
    expect(() => readOAuthTransaction()).not.toThrow();
    expect(readOAuthTransaction()).toBeNull();
  });

  it('should return null when the stored value is valid JSON but not a transaction', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ provider: 'google' }));
    expect(readOAuthTransaction()).toBeNull();
  });

  it('should return null when the stored transaction has no state', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ provider: 'kakao' }));
    expect(readOAuthTransaction()).toBeNull();
  });

  it('should return null without throwing when sessionStorage access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => readOAuthTransaction()).not.toThrow();
    expect(readOAuthTransaction()).toBeNull();
  });

  it('should not throw when saving fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(() => saveOAuthTransaction({ provider: 'kakao', state: 's1' })).not.toThrow();
  });
});
