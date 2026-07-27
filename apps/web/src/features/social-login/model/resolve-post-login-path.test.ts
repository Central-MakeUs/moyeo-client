import { describe, it, expect } from 'vitest';

import { resolvePostLoginPath } from './resolve-post-login-path';

const ONBOARDED = { id: 1, nickname: 'moyeo', onboardingCompleted: true };
const NOT_ONBOARDED = { id: 1, nickname: null, onboardingCompleted: false };

describe('resolvePostLoginPath', () => {
  it("should return '/nickname' when user.onboardingCompleted is false", () => {
    expect(resolvePostLoginPath(NOT_ONBOARDED)).toBe('/nickname');
  });

  it("should return '/nickname' when onboarding is incomplete even if next is given", () => {
    expect(resolvePostLoginPath(NOT_ONBOARDED, '/i/abc123')).toBe('/nickname');
  });

  it("should return '/nickname' when the user is undefined", () => {
    expect(resolvePostLoginPath(undefined)).toBe('/nickname');
  });

  it('should return the default path when onboarding is complete and next is absent', () => {
    expect(resolvePostLoginPath(ONBOARDED)).toBe('/');
  });

  it('should return the next path when onboarding is complete and next is an internal path', () => {
    expect(resolvePostLoginPath(ONBOARDED, '/i/abc123')).toBe('/i/abc123');
  });

  it('should ignore an external next path when onboarding is complete', () => {
    expect(resolvePostLoginPath(ONBOARDED, 'https://evil.com')).toBe('/');
    expect(resolvePostLoginPath(ONBOARDED, '//evil.com')).toBe('/');
  });
});
