import { describe, it, expect } from 'vitest';

import { resolvePostLoginPath } from './resolve-post-login-path';

describe('resolvePostLoginPath', () => {
  it("should return '/nickname' when user.onboardingCompleted is false", () => {
    expect(resolvePostLoginPath({ id: 1, nickname: null, onboardingCompleted: false })).toBe(
      '/nickname'
    );
  });

  it("should return '/home' when user.onboardingCompleted is true", () => {
    expect(resolvePostLoginPath({ id: 1, nickname: 'moyeo', onboardingCompleted: true })).toBe(
      '/home'
    );
  });
});
