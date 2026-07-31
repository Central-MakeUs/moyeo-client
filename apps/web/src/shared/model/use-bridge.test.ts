import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { NativeToWebMessage } from '@repo/types';

import { useNativeMessage } from './use-bridge';

/**
 * 이 테스트는 **전송 계층**만 본다 — 어느 타겟에 dispatch되든 정확히 한 번 전달되는가,
 * 브릿지가 아닌 message 이벤트를 거르는가.
 *
 * 메시지 종류별 처리는 각 소비자(session-provider · use-invite-share)의 책임이므로
 * `NativeToWebMessage`에 항목이 추가돼도 이 파일은 바뀌지 않는다.
 */

/** 종류와 무관한 대표 메시지 하나. 전송 계층은 type 값을 해석하지 않는다. */
const SAMPLE_MESSAGE: NativeToWebMessage = { type: 'AUTH_NONE' };

/** iOS의 react-native-webview: window에 dispatch한다. */
function dispatchFromIos(data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data }));
}

/**
 * Android의 react-native-webview: document에 dispatch하며 `bubbles`를 켜지 않는다.
 * 그래서 window의 **버블** 리스너로는 잡히지 않는다.
 */
function dispatchFromAndroid(data: unknown) {
  document.dispatchEvent(new MessageEvent('message', { data }));
}

describe('useNativeMessage', () => {
  let handler: Mock<(message: NativeToWebMessage) => void>;

  beforeEach(() => {
    handler = vi.fn<(message: NativeToWebMessage) => void>();
  });

  it('iOS처럼 window에 dispatch된 메시지를 전달한다', () => {
    renderHook(() => useNativeMessage(handler));

    dispatchFromIos(JSON.stringify(SAMPLE_MESSAGE));

    expect(handler).toHaveBeenCalledWith(SAMPLE_MESSAGE);
  });

  it('Android처럼 document에 dispatch된 메시지를 전달한다', () => {
    renderHook(() => useNativeMessage(handler));

    dispatchFromAndroid(JSON.stringify(SAMPLE_MESSAGE));

    expect(handler).toHaveBeenCalledWith(SAMPLE_MESSAGE);
  });

  it('document에 dispatch된 메시지를 두 번 전달하지 않는다', () => {
    renderHook(() => useNativeMessage(handler));

    dispatchFromAndroid(JSON.stringify(SAMPLE_MESSAGE));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('버블링되는 메시지도 두 번 전달하지 않는다', () => {
    renderHook(() => useNativeMessage(handler));

    // react-native-webview의 레거시 폴백 경로는 bubbles를 켠 채 document에 dispatch한다.
    document.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(SAMPLE_MESSAGE), bubbles: true })
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('JSON이 아닌 데이터는 무시한다', () => {
    renderHook(() => useNativeMessage(handler));

    dispatchFromIos('not json');

    expect(handler).not.toHaveBeenCalled();
  });

  it('문자열이 아닌 데이터는 무시한다', () => {
    renderHook(() => useNativeMessage(handler));

    // 카카오 SDK 팝업처럼 객체를 그대로 실어 보내는 message 이벤트가 있다.
    dispatchFromIos({ type: 'AUTH_NONE' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('type이 없는 JSON은 무시한다', () => {
    renderHook(() => useNativeMessage(handler));

    dispatchFromIos(JSON.stringify({ payload: { token: 'abc' } }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('언마운트 후에는 메시지를 전달하지 않는다', () => {
    const { unmount } = renderHook(() => useNativeMessage(handler));

    unmount();
    dispatchFromIos(JSON.stringify(SAMPLE_MESSAGE));
    dispatchFromAndroid(JSON.stringify(SAMPLE_MESSAGE));

    expect(handler).not.toHaveBeenCalled();
  });
});
