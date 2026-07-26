'use client';

import { useCallback, useEffect } from 'react';

import type { NativeToWebMessage } from '@repo/types';

import { useNativeMessage, usePostMessage } from '@/shared/model';

import { isNativeContext, NATIVE_HANDSHAKE_TIMEOUT_MS } from '../model/native-bridge';
import { setSessionToken } from '../model/session-contract';
import { readStoredToken } from '../model/session-storage';
import { useSessionStore } from '../model/session-store';

/**
 * 앱 시작 시 세션을 복원한다.
 *
 * 1. 저장소에 토큰이 있으면 네이티브 핸드셰이크 없이 해당 토큰을 세션에 적용한다.
 * 2. 토큰이 없고 네이티브 WebView면 READY를 보내고 AUTH_TOKEN/AUTH_NONE을 기다린다.
 * 3. 타임아웃이 지나거나 웹 브라우저면 비로그인으로 확정한다.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const postMessage = usePostMessage();

  /** RN -> WEB message 핸들러 */
  const handleNativeMessage = useCallback((message: NativeToWebMessage) => {
    // RN에 저장된 auth token이 있는 경우
    if (message.type === 'AUTH_TOKEN') {
      setSessionToken(message.payload.token); // 네이티브가 보관하던 토큰으로 웹 세션 복원
      return;
    }

    // RN에 저장된 auth token이 없는 경우
    if (message.type === 'AUTH_NONE') {
      useSessionStore.getState().finishRestore(); // 네이티브에 저장된 토큰이 없으므로 복원 절차 종료
    }
  }, []);

  useNativeMessage(handleNativeMessage); // handleNativeMessage 핸들러로 message event 핸들러 등록

  useEffect(() => {
    const storedToken = readStoredToken();

    // 저장된 토큰이 있는 경우
    if (storedToken) {
      setSessionToken(storedToken);
      return;
    }

    // RN webview 실행환경이 아닌 경우
    if (!isNativeContext()) {
      useSessionStore.getState().finishRestore();
      return;
    }

    postMessage({ type: 'READY' }); // WEB -> RN : 네이티브 메시지 수신 준비가 완료되었음을 RN에 알림

    const timer = setTimeout(() => {
      useSessionStore.getState().finishRestore();
    }, NATIVE_HANDSHAKE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [postMessage]);

  return <>{children}</>;
}
