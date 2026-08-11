import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from './session-store';
import { setSessionToken } from './session-contract';

describe('setSessionToken WebView 브리지', () => {
  const postMessage = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    useSessionStore.setState({ accessToken: null, isRestored: false });
    postMessage.mockClear();
    window.ReactNativeWebView = { postMessage };
  });

  it('로그인 토큰을 웹 세션에 저장하고 네이티브 SecureStore 보관을 요청한다', () => {
    setSessionToken('access-token');

    expect(useSessionStore.getState()).toMatchObject({
      accessToken: 'access-token',
      isRestored: true,
    });
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ type: 'AUTH_SIGNED_IN', payload: { token: 'access-token' } })
    );
  });

  it('네이티브에서 복원한 토큰은 다시 네이티브로 보내지 않는다', () => {
    setSessionToken('restored-token', { notifyNative: false });

    expect(useSessionStore.getState().accessToken).toBe('restored-token');
    expect(postMessage).not.toHaveBeenCalled();
  });
});
