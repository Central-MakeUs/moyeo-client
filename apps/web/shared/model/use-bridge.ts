import { useEffect, useCallback } from 'react';
import type { NativeToWebMessage, WebToNativeMessage } from '@repo/types';
// WebView → RN 메시지 전송
export function usePostMessage() {
    return useCallback((msg: WebToNativeMessage) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify(msg));
    }, []);
}
// RN → WebView 메시지 수신
export function useNativeMessage(handler: (msg: NativeToWebMessage) => void) {
    useEffect(() => {
        const listener = (e: MessageEvent) => {
            try {
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
