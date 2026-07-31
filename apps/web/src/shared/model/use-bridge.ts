'use client';

import { useEffect, useCallback } from 'react';
import type { NativeToWebMessage, WebToNativeMessage } from '@repo/types';

// WebView → RN 메시지 전송
export function usePostMessage() {
  return useCallback((msg: WebToNativeMessage) => {
    window.ReactNativeWebView?.postMessage(JSON.stringify(msg));
  }, []);
}

/**
 * message 이벤트 데이터를 브릿지 메시지로 좁히는 함수
 *
 * - 존재하지 않는 이벤트는 null을 반환
 */
function toNativeMessage(data: unknown): NativeToWebMessage | null {
  if (typeof data !== 'string') return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  if (typeof (parsed as Record<string, unknown>).type !== 'string') return null;

  return parsed as NativeToWebMessage;
}

/**
 * Native(WebView)에서 전달한 메시지를 web에서 구독할 수 있게 해주는 Hook.
 *
 * 컴포넌트가 마운트되면 message 이벤트를 등록하고,
 * 언마운트 시 자동으로 해제한다.
 *
 * @param handler 수신한 메시지를 처리하는 콜백 - 처리 방법은 `useNativeMessage` 호출처에서 결정한다.
 */
export function useNativeMessage(handler: (msg: NativeToWebMessage) => void) {
  useEffect(() => {
    const listener = (event: Event) => {
      const message = toNativeMessage((event as MessageEvent).data);
      if (message === null) return;

      handler(message);
    };

    window.addEventListener('message', listener, true);
    return () => window.removeEventListener('message', listener, true);
  }, [handler]);
}
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}
