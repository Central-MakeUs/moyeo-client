import { describe, it, expect } from 'vitest';

import { resolveGuardAccess } from './session-routing';

describe('resolveGuardAccess', () => {
  it('should allow any protected path when authenticated and onboarded', () => {
    expect(
      resolveGuardAccess(
        { status: 'authenticated', user: { id: 1, nickname: '모여', onboardingCompleted: true } },
        '/meetings'
      )
    ).toEqual({ status: 'allow' });
  });

  it('should allow when not onboarded and already on /nickname', () => {
    expect(
      resolveGuardAccess(
        { status: 'authenticated', user: { id: 1, nickname: null, onboardingCompleted: false } },
        '/nickname'
      )
    ).toEqual({ status: 'allow' });
  });

  it('should redirect to /nickname when not onboarded and not on /nickname', () => {
    expect(
      resolveGuardAccess(
        { status: 'authenticated', user: { id: 1, nickname: null, onboardingCompleted: false } },
        '/home'
      )
    ).toEqual({ status: 'redirect', path: '/nickname', clearSession: false });
  });

  it('should redirect to /login when no-token', () => {
    expect(resolveGuardAccess({ status: 'no-token' }, '/home')).toEqual({
      status: 'redirect',
      path: '/login',
      clearSession: false,
    });
  });

  it('should redirect to /login and clear session when unauthorized', () => {
    expect(resolveGuardAccess({ status: 'unauthorized' }, '/home')).toEqual({
      status: 'redirect',
      path: '/login',
      clearSession: true,
    });
  });
});
