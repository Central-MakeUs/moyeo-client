import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

import { requestNative } from './request-native';

type PostMessageMock = Mock<(message: string) => void>;

/** 네이티브가 보내는 응답을 흉내낸다. iOS 경로(window dispatch)를 쓴다. */
function replyFromNative(message: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) }));
}

/** 직전에 보낸 요청의 requestId를 꺼낸다. 값 자체는 계약이 아니므로 형식을 검증하지 않는다. */
function lastRequestId(postMessage: PostMessageMock): string {
  const [payload] = postMessage.mock.lastCall as [string];
  return JSON.parse(payload).requestId;
}

describe('requestNative', () => {
  let postMessage: PostMessageMock;

  beforeEach(() => {
    postMessage = vi.fn<(message: string) => void>();
    window.ReactNativeWebView = { postMessage };
  });

  afterEach(() => {
    delete window.ReactNativeWebView;
    vi.useRealTimers();
  });

  it('요청에 requestId를 붙여 네이티브로 보낸다', () => {
    void requestNative({ type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } }, 'COPY_RESULT');

    const sent = JSON.parse((postMessage.mock.lastCall as [string])[0]);

    expect(sent).toMatchObject({ type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } });
    expect(typeof sent.requestId).toBe('string');
  });

  it('같은 requestId의 응답으로 resolve한다', async () => {
    const pending = requestNative(
      { type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } },
      'COPY_RESULT'
    );

    replyFromNative({
      type: 'COPY_RESULT',
      requestId: lastRequestId(postMessage),
      payload: { state: 'success' },
    });

    await expect(pending).resolves.toMatchObject({ payload: { state: 'success' } });
  });

  it('다른 requestId의 응답은 무시한다', async () => {
    vi.useFakeTimers();

    const pending = requestNative(
      { type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } },
      'COPY_RESULT',
      { timeoutMs: 100 }
    );

    // 다른 화면이 보낸 요청의 결과가 도착한 상황.
    replyFromNative({
      type: 'COPY_RESULT',
      requestId: 'someone-else',
      payload: { state: 'success' },
    });
    vi.advanceTimersByTime(100);

    await expect(pending).rejects.toThrow(/timed out/);
  });

  it('요청마다 다른 requestId를 발급한다', () => {
    void requestNative({ type: 'COPY_TO_CLIPBOARD', payload: { text: 'a' } }, 'COPY_RESULT');
    const first = lastRequestId(postMessage);

    void requestNative({ type: 'COPY_TO_CLIPBOARD', payload: { text: 'b' } }, 'COPY_RESULT');
    const second = lastRequestId(postMessage);

    expect(first).not.toBe(second);
  });

  it('응답이 없으면 시간 초과로 reject한다', async () => {
    vi.useFakeTimers();

    const pending = requestNative(
      { type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } },
      'COPY_RESULT',
      { timeoutMs: 100 }
    );

    vi.advanceTimersByTime(100);

    await expect(pending).rejects.toThrow(/timed out/);
  });

  it('네이티브 컨텍스트가 아니면 보내지 않고 즉시 reject한다', async () => {
    delete window.ReactNativeWebView;

    const pending = requestNative(
      { type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } },
      'COPY_RESULT'
    );

    await expect(pending).rejects.toThrow(/unavailable/);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('응답을 받은 뒤에는 리스너를 남기지 않는다', async () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');

    const pending = requestNative(
      { type: 'COPY_TO_CLIPBOARD', payload: { text: 'link' } },
      'COPY_RESULT'
    );

    replyFromNative({
      type: 'COPY_RESULT',
      requestId: lastRequestId(postMessage),
      payload: { state: 'success' },
    });
    await pending;

    expect(removeEventListener).toHaveBeenCalledTimes(addEventListener.mock.calls.length);

    addEventListener.mockRestore();
    removeEventListener.mockRestore();
  });
});
