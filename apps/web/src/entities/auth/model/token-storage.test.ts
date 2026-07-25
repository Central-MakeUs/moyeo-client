import { describe, it, expect, beforeEach } from 'vitest';

import { clearToken, getToken, setToken } from './token-storage';

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return the token when reading after setToken', () => {
    setToken('jwt');
    expect(getToken()).toBe('jwt');
  });

  it('should return null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('should return null after clearToken', () => {
    setToken('jwt');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
