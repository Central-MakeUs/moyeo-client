import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setToken } from '../model/token-storage';
import { putOnboarding } from './put-onboarding';

const ONBOARDING_RESPONSE = {
  id: 1,
  nickname: '모여',
  onboardingCompleted: true,
};

describe('putOnboarding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should PUT /api/users/me/onboarding with Bearer token and body { nickname } when called', async () => {
    setToken('tok');
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ONBOARDING_RESPONSE });
    vi.stubGlobal('fetch', fetchMock);

    await putOnboarding({ nickname: '모여' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/me/onboarding'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer tok',
        }),
        body: JSON.stringify({ nickname: '모여' }),
      })
    );
  });

  it('should return the response JSON as AuthUserResponse', async () => {
    setToken('tok');
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ONBOARDING_RESPONSE });
    vi.stubGlobal('fetch', fetchMock);

    const result = await putOnboarding({ nickname: '모여' });

    expect(result).toEqual(ONBOARDING_RESPONSE);
  });
});
