import { describe, it, expect } from 'vitest';

import { buildKakaoAuthorizeUrl } from './build-kakao-authorize-url';

describe('buildKakaoAuthorizeUrl', () => {
  const params = {
    clientId: '5567c1bd1ca31b8f3cd3f58aad0cf65e',
    redirectUri: 'https://moyeo-dev.vercel.app/auth/callback/kakao',
    state: 's1',
  };

  it('should return a URL starting with the Kakao authorize endpoint when given params', () => {
    expect(buildKakaoAuthorizeUrl(params)).toMatch(
      /^https:\/\/kauth\.kakao\.com\/oauth\/authorize/
    );
  });

  it('should include response_type, client_id, redirect_uri, state in the query when given params', () => {
    const url = new URL(buildKakaoAuthorizeUrl(params));
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('5567c1bd1ca31b8f3cd3f58aad0cf65e');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://moyeo-dev.vercel.app/auth/callback/kakao'
    );
    expect(url.searchParams.get('state')).toBe('s1');
  });
});
