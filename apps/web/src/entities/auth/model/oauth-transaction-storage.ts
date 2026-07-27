import type { OAuthProvider, OAuthTransaction } from './types';

/**
 * OAuth 왕복(authorize → callback) 동안만 살아있는 state/nonce 보관소.
 *
 * 탭을 닫으면 같이 사라져야 하므로 `sessionStorage`를 쓴다.
 * 공급자 페이지로 나갔다 같은 origin으로 돌아오는 왕복에서는 유지된다.
 *
 * WebView·Safari 프라이빗 모드에서는 `sessionStorage` 접근 자체가 throw할 수 있어 모든 접근을 감싼다.
 * 저장에 실패하면 콜백의 state 검증에서 걸려 로그인 실패로 끝나는데,
 * 이는 검증 없이 통과시키는 것보다 안전한 방향이다.
 */

const STORAGE_KEY = 'moyeo.oauth.transaction';

const OAUTH_PROVIDERS: readonly OAuthProvider[] = ['apple', 'kakao'];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** 다른 코드가 남긴 값이나 예전 구조를 트랜잭션으로 오인하지 않는다. */
function toTransaction(value: unknown): OAuthTransaction | null {
  if (typeof value !== 'object' || value === null) return null;

  const { provider, state, nonce, next } = value as Partial<OAuthTransaction>;
  if (!provider || !OAUTH_PROVIDERS.includes(provider)) return null;
  if (typeof state !== 'string' || state.length === 0) return null;
  if (nonce !== undefined && typeof nonce !== 'string') return null;
  if (next !== undefined && typeof next !== 'string') return null;

  const transaction: OAuthTransaction = { provider, state };
  if (nonce !== undefined) transaction.nonce = nonce;
  if (next !== undefined) transaction.next = next;

  return transaction;
}

export function saveOAuthTransaction(transaction: OAuthTransaction): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(transaction));
  } catch {
    // no-op — 저장 실패는 콜백에서 state_mismatch로 드러난다.
  }
}

export function readOAuthTransaction(): OAuthTransaction | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    return toTransaction(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearOAuthTransaction(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
