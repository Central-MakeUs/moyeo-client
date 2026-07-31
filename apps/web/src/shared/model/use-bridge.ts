'use client';

import { useEffect } from 'react';
import type { NativeToWebMessage, WebToNativeMessage } from '@repo/types';

/**
 * Web에서 네이티브 앱으로 메시지를 전송한다.
 *
 * React Native WebView 브리지가 없으면 아무 작업도 하지 않는다.
 * 네이티브 응답이 필요한 경우에는 브리지 부재를 오류로 처리하는
 * `requestNative`를 사용한다.
 *
 *
 * @param message 네이티브 앱으로 전송할 메시지
 */
export function postMessageToNative(message: WebToNativeMessage): void {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

/**
 * message 이벤트의 데이터를 네이티브 메시지 형식으로 변환한다.
 *
 * JSON 문자열이 아니거나 기본 메시지 형식을 충족하지 않으면 `null`을 반환한다.
 *
 * @param data message 이벤트로 전달된 원본 데이터
 * @returns 변환된 네이티브 메시지 또는 `null`
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
  // TODO: 브리지에서 받은 메시지의 type과 payload를 런타임에 검증하도록
  // NativeToWebMessage 스키마를 정의한다. 메시지 종류가 늘어나면 Zod 도입을 검토한다

  return parsed as NativeToWebMessage;
}

/**
 * 네이티브 앱에서 전달되는 메시지를 구독한다.
 *
 * `react-native-webview`는 iOS에서 `window`, Android에서 `document`를 대상으로
 * message 이벤트를 전달한다. Android 이벤트는 `bubbles: false`로 전달되므로
 * `window`의 버블 단계에서는 수신할 수 없다. 하지만 `document`를 대상으로
 * 전달된 이벤트도 캡처 단계에서는 먼저 `window`를 거치므로, 두 플랫폼의
 * 이벤트를 모두 처리할 수 있도록 `window`의 캡처 단계에서 수신한다.
 *
 * @param handler 유효한 네이티브 메시지를 수신할 때 호출할 함수
 * @returns message 이벤트 구독을 해제하는 함수
 */
export function subscribeNativeMessage(handler: (msg: NativeToWebMessage) => void): () => void {
  const listener = (event: Event) => {
    const message = toNativeMessage((event as MessageEvent).data);
    if (message === null) return;

    handler(message);
  };

  window.addEventListener('message', listener, true);
  return () => window.removeEventListener('message', listener, true);
}

/**
 * 네이티브 앱에서 전달되는 메시지를 구독한다.
 *
 * 컴포넌트가 마운트되거나 `handler`가 변경되면 구독하고,
 * 언마운트되거나 다음 effect가 실행되기 전에 기존 구독을 해제한다.
 *
 * @param handler 유효한 네이티브 메시지를 수신할 때 호출할 함수
 */
export function useNativeMessageListener(handler: (msg: NativeToWebMessage) => void) {
  useEffect(() => subscribeNativeMessage(handler), [handler]);
}
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}
