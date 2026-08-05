import type { WebToNativeMessage } from '@repo/types';

export function postToNative(message: WebToNativeMessage): void {
  if (typeof window === 'undefined') return;
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

/**
 * 네이티브가 `AUTH_TOKEN` / `AUTH_NONE` 중 무엇도 보내지 않을 때 비로그인으로 확정하기까지의 대기 시간.
 * 저장소에 토큰이 있으면 이 대기를 아예 하지 않으므로, 로그인 사용자는 영향을 받지 않는다.
 */
export const NATIVE_HANDSHAKE_TIMEOUT_MS = 1500;
