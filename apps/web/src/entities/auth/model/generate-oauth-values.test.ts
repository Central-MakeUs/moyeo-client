import { describe, it, expect } from 'vitest';

import { generateNonce, generateState } from './generate-oauth-values';

describe('generateState', () => {
  it('should return a non-empty string when called', () => {
    const state = generateState();
    expect(typeof state).toBe('string');
    expect(state.length).toBeGreaterThan(0);
  });

  it('should return different values when called twice', () => {
    expect(generateState()).not.toBe(generateState());
  });
});

describe('generateNonce', () => {
  it('should return a non-empty string when called', () => {
    const nonce = generateNonce();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('should return different values when called twice', () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});
