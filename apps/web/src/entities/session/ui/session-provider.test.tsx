import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NATIVE_HANDSHAKE_TIMEOUT_MS } from '../model/native-bridge';
import { useSessionStore } from '../model/session-store';

import { SessionProvider } from './session-provider';

function dispatchNativeMessage(message: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) }));
}

describe('SessionProvider WebView 핸드셰이크', () => {
  const postMessage = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    useSessionStore.setState({ accessToken: null, isRestored: false });
    postMessage.mockClear();
    window.ReactNativeWebView = { postMessage };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.ReactNativeWebView;
  });

  it('저장 토큰이 없으면 READY를 보내고 네이티브 응답을 기다린다', async () => {
    render(<SessionProvider>앱</SessionProvider>);

    await waitFor(() =>
      expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'READY' }))
    );
    expect(useSessionStore.getState().isRestored).toBe(false);
  });

  it('AUTH_TOKEN을 받으면 웹 세션을 복원하되 같은 토큰을 되돌려 보내지 않는다', async () => {
    render(<SessionProvider>앱</SessionProvider>);
    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));

    act(() => dispatchNativeMessage({ type: 'AUTH_TOKEN', payload: { token: 'native-token' } }));

    expect(useSessionStore.getState()).toMatchObject({
      accessToken: 'native-token',
      isRestored: true,
    });
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('AUTH_NONE을 받으면 비로그인 상태로 복원을 끝낸다', async () => {
    render(<SessionProvider>앱</SessionProvider>);
    await waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));

    act(() => dispatchNativeMessage({ type: 'AUTH_NONE' }));

    expect(useSessionStore.getState()).toMatchObject({ accessToken: null, isRestored: true });
  });

  it('네이티브가 응답하지 않아도 제한 시간이 지나면 비로그인 상태로 진행한다', async () => {
    vi.useFakeTimers();
    render(<SessionProvider>앱</SessionProvider>);

    await act(async () => vi.advanceTimersByTime(NATIVE_HANDSHAKE_TIMEOUT_MS));

    expect(useSessionStore.getState()).toMatchObject({ accessToken: null, isRestored: true });
  });
});
