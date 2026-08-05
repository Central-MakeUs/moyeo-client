import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { readOAuthTransaction } from '@/entities/auth';

import { startKakaoLogin } from './start-kakao-login';

describe('startKakaoLogin', () => {
  let assignMock: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_KAKAO_CLIENT_ID', '5567c1bd1ca31b8f3cd3f58aad0cf65e');
    vi.stubEnv('NEXT_PUBLIC_OAUTH_REDIRECT_TARGET', 'local');
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

  it('should save provider=kakao and state to sessionStorage when called', () => {
    startKakaoLogin();

    const transaction = readOAuthTransaction();
    expect(transaction?.provider).toBe('kakao');
    expect(transaction?.state).toBeTruthy();
  });

  it('should call window.location.assign once with a Kakao URL containing client_id, redirect_uri, state when called', () => {
    startKakaoLogin();

    expect(assignMock).toHaveBeenCalledTimes(1);
    const url = new URL(assignMock.mock.calls[0]?.[0] as string);
    expect(url.origin + url.pathname).toBe('https://kauth.kakao.com/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('5567c1bd1ca31b8f3cd3f58aad0cf65e');
    expect(url.searchParams.get('redirect_uri')).toContain('/auth/callback/kakao');
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('should use the same state in sessionStorage and the redirect URL when called', () => {
    startKakaoLogin();

    const transaction = readOAuthTransaction();
    const url = new URL(assignMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('state')).toBe(transaction?.state);
  });
});
