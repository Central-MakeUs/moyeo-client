import {
  buildAppleAuthorizeUrl,
  generateNonce,
  generateState,
  getAppleClientId,
  getAppleRedirectTarget,
  getRedirectUri,
  saveOAuthTransaction,
} from '@/entities/auth';
import { toSafeNextPath } from '@/entities/session';

/**
 * Apple authorize 페이지로 이동한다.
 * `next`는 로그인 후 돌아갈 내부 경로이며, 왕복 동안 유실되지 않도록 트랜잭션에 함께 저장한다.
 */
export function startAppleLogin(next?: string | null): void {
  // Apple 웹 로그인은 local 콜백을 지원하지 않으므로 공급자 페이지로 이동하기 전에 검증한다.
  getAppleRedirectTarget();

  const state = generateState();
  const nonce = generateNonce();
  const safeNext = toSafeNextPath(next);

  saveOAuthTransaction({
    provider: 'apple',
    state,
    nonce,
    ...(safeNext ? { next: safeNext } : {}),
  });

  const url = buildAppleAuthorizeUrl({
    clientId: getAppleClientId(),
    redirectUri: getRedirectUri('apple'),
    state,
    nonce,
  });

  window.location.assign(url);
}
