import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { readOAuthTransaction } from '@/entities/auth';

import { startAppleLogin } from './start-apple-login';

describe('startAppleLogin', () => {
  let assignMock: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_APPLE_CLIENT_ID', 'com.moyeozo.moyeo.web');
    vi.stubEnv('NEXT_PUBLIC_OAUTH_REDIRECT_TARGET', 'dev');
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        origin: 'https://moyeo-dev.vercel.app',
        href: 'https://moyeo-dev.vercel.app/login',
        assign: assignMock,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('should save provider=apple, state and nonce to sessionStorage when called', () => {
    startAppleLogin();

    const transaction = readOAuthTransaction();
    expect(transaction?.provider).toBe('apple');
    expect(transaction?.state).toBeTruthy();
    expect(transaction?.nonce).toBeTruthy();
  });

  it('should call window.location.assign once with an Apple URL containing client_id, redirect_uri, state and nonce when called', () => {
    startAppleLogin();

    expect(assignMock).toHaveBeenCalledTimes(1);
    const url = new URL(assignMock.mock.calls[0]?.[0] as string);
    expect(url.origin + url.pathname).toBe('https://appleid.apple.com/auth/authorize');
    expect(url.searchParams.get('client_id')).toBe('com.moyeozo.moyeo.web');
    expect(url.searchParams.get('redirect_uri')).toContain('/auth/callback/apple');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('nonce')).toBeTruthy();
  });

  it('should use the same state and nonce in sessionStorage and the redirect URL when called', () => {
    startAppleLogin();

    const transaction = readOAuthTransaction();
    const url = new URL(assignMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('state')).toBe(transaction?.state);
    expect(url.searchParams.get('nonce')).toBe(transaction?.nonce);
  });
});
