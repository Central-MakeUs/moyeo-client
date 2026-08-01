import { configureAuth } from '@/shared/api';
import { isNativeContext } from '@/shared/model';

import { postToNative } from './native-bridge';
import { clearStoredToken, readStoredToken, writeStoredToken } from './session-storage';
import { useSessionStore } from './session-store';

/**
 * 세션 계약 — 모든 로그인 경로(dev 로그인, 소셜 로그인)가 이 3개 함수에만 쓴다.
 * 토큰 획득 방법은 달라도 세션을 만드는 방법은 하나여야 가드가 갈라지지 않는다.
 */

interface SetSessionTokenOptions {
  /**
   * 네이티브 SecureStore에도 토큰을 보관시킬지.
   *
   * 기본값은 `true`다. 네이티브가 보낸 `AUTH_TOKEN`으로 세션을 복원할 때만 `false`를 준다.
   * 방금 받은 토큰을 그대로 돌려보내는 왕복이기 때문이다.
   */
  notifyNative?: boolean;
}

export function setSessionToken(accessToken: string, options?: SetSessionTokenOptions): void {
  writeStoredToken(accessToken);
  useSessionStore.getState().setToken(accessToken);

  if (options?.notifyNative === false) return;

  // 네이티브가 다음 실행에서 AUTH_TOKEN으로 돌려줄 수 있도록 보관을 요청한다.
  // 네이티브가 아직 듣지 않아도 무해하다.
  if (isNativeContext()) {
    postToNative({ type: 'AUTH_SIGNED_IN', payload: { token: accessToken } });
  }
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
