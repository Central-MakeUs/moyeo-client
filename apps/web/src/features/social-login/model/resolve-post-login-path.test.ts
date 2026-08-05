import { describe, it, expect } from 'vitest';

import { resolvePostLoginPath } from './resolve-post-login-path';

const ONBOARDED = { id: 1, nickname: 'moyeo', onboardingCompleted: true };
const NOT_ONBOARDED = { id: 1, nickname: null, onboardingCompleted: false };

describe('resolvePostLoginPath', () => {
  it("should return '/nickname' when user.onboardingCompleted is false", () => {
    expect(resolvePostLoginPath(NOT_ONBOARDED)).toBe('/nickname');
  });

  it("should return '/nickname' when the user is undefined", () => {
    expect(resolvePostLoginPath(undefined)).toBe('/nickname');
  });

  // #148부터 온보딩이 남아도 next를 버리지 않는다(prd.md ADR-4).
  it('온보딩이 남았고 next가 /i/ABC123이면 next를 실은 온보딩 경로를 돌려준다', () => {
    expect(resolvePostLoginPath(NOT_ONBOARDED, '/i/ABC123')).toBe('/nickname?next=%2Fi%2FABC123');
  });

  it('온보딩이 남았고 next가 //evil.com이면 쿼리 없이 /nickname을 돌려준다', () => {
    expect(resolvePostLoginPath(NOT_ONBOARDED, '//evil.com')).toBe('/nickname');
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
