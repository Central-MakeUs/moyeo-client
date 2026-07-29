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
 * Native(WebView)에서 전달한 메시지를 web에서 구독할 수 있게 해주는 Hook.
 *
 * 컴포넌트가 마운트되면 message 이벤트를 등록하고,
 * 언마운트 시 자동으로 해제한다.
 *
 * @param handler 수신한 메시지를 처리하는 콜백 - 처리 방법은 `useNativeMessage` 호출처에서 결정한다.
 */
export function useNativeMessage(handler: (msg: NativeToWebMessage) => void) {
  useEffect(() => {
    const listener = (e: MessageEvent) => {
      try {
        /** TODO: 파싱 + 검증까지 처리한다면 더 좋을 수 있음 ex) zod */
        handler(JSON.parse(e.data));
      } catch {
        return;
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);
}
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}
