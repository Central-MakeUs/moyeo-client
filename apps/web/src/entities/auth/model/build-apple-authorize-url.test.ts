import { describe, it, expect } from 'vitest';

import { buildAppleAuthorizeUrl } from './build-apple-authorize-url';

describe('buildAppleAuthorizeUrl', () => {
  const params = {
    clientId: 'com.moyeozo.moyeo.web',
    redirectUri: 'https://moyeo-dev.vercel.app/auth/callback/apple',
    state: 's1',
    nonce: 'n1',
  };

  it('should return a URL starting with the Apple authorize endpoint when given params', () => {
    expect(buildAppleAuthorizeUrl(params)).toMatch(
      /^https:\/\/appleid\.apple\.com\/auth\/authorize/
    );
  });

  it('should include response_type, response_mode, client_id, redirect_uri, state, nonce in the query when given params', () => {
    const url = new URL(buildAppleAuthorizeUrl(params));
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('response_mode')).toBe('query');
    expect(url.searchParams.get('client_id')).toBe('com.moyeozo.moyeo.web');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://moyeo-dev.vercel.app/auth/callback/apple'
    );
    expect(url.searchParams.get('state')).toBe('s1');
    expect(url.searchParams.get('nonce')).toBe('n1');
  });
});
