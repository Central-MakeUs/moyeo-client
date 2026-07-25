import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { postAppleLogin } from './post-apple-login';

describe('postAppleLogin', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://api.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should POST to /api/auth/apple with body {code, nonce} when called', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    await postAppleLogin({ code: 'xxx', nonce: 'n1' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/apple'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'xxx', nonce: 'n1' }),
      })
    );
  });

  it('should return the parsed AuthResponse when fetch resolves', async () => {
    const authResponse = {
      accessToken: 'jwt',
      tokenType: 'Bearer',
      user: { id: 1, nickname: null, onboardingCompleted: false },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => authResponse }));

    const res = await postAppleLogin({ code: 'xxx', nonce: 'n1' });

    expect(res).toEqual(authResponse);
  });
});
