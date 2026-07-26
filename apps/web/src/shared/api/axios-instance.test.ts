import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AxiosResponse } from 'axios';

import { AXIOS_INSTANCE } from './axios-instance';
import { setToken } from './token-storage';

describe('AXIOS_INSTANCE 인증 인터셉터', () => {
  const originalAdapter = AXIOS_INSTANCE.defaults.adapter;
  let capturedAuthorization: unknown;

  beforeEach(() => {
    localStorage.clear();
    capturedAuthorization = undefined;
    AXIOS_INSTANCE.defaults.adapter = async (config) => {
      capturedAuthorization = config.headers.get('Authorization');
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse;
    };
  });

  afterEach(() => {
    AXIOS_INSTANCE.defaults.adapter = originalAdapter;
    localStorage.clear();
  });

  it('should attach Authorization: Bearer <token> when a token is stored', async () => {
    setToken('jwt');

    await AXIOS_INSTANCE.get('/protected');

    expect(capturedAuthorization).toBe('Bearer jwt');
  });

  it('should not attach Authorization when no token is stored', async () => {
    await AXIOS_INSTANCE.get('/protected');

    expect(capturedAuthorization).toBeFalsy();
  });
});
