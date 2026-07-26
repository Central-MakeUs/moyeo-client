import { configureAuth } from '@/shared/api';

import { isNativeContext, postToNative } from './native-bridge';
import { clearStoredToken, readStoredToken, writeStoredToken } from './session-storage';
import { useSessionStore } from './session-store';

/**
 * 세션 계약 — 모든 로그인 경로(dev 로그인, 소셜 로그인)가 이 3개 함수에만 쓴다.
 * 토큰 획득 방법은 달라도 세션을 만드는 방법은 하나여야 가드가 갈라지지 않는다.
 */

export function setSessionToken(accessToken: string): void {
  writeStoredToken(accessToken);
  useSessionStore.getState().setToken(accessToken);
}

export function getSessionToken(): string | null {
  // 복원 전(store가 비어 있는 시점)에도 저장소 값으로 요청을 보낼 수 있어야 한다.
  return useSessionStore.getState().accessToken ?? readStoredToken();
}

export function clearSession(): void {
  clearStoredToken();
  useSessionStore.getState().clearToken();

  // 네이티브 SecureStore에도 로그아웃을 알린다. 네이티브가 아직 듣지 않아도 무해하다.
  if (isNativeContext()) {
    postToNative({ type: 'AUTH_SIGNED_OUT' });
  }
}

// HTTP client에 세션 구현을 주입한다. shared는 session entity를 import할 수 없다. (의존성 주입)
configureAuth({
  readAuthToken: getSessionToken,
  onUnauthorized: clearSession,
});
