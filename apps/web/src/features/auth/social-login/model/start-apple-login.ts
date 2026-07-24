import {
  buildAppleAuthorizeUrl,
  generateNonce,
  generateState,
  getAppleClientId,
  getRedirectUri,
  saveOAuthTransaction,
} from '@/entities/auth';

export function startAppleLogin(): void {
  const state = generateState();
  const nonce = generateNonce();

  saveOAuthTransaction({ provider: 'apple', state, nonce });

  const url = buildAppleAuthorizeUrl({
    clientId: getAppleClientId(),
    redirectUri: getRedirectUri('apple'),
    state,
    nonce,
  });

  window.location.assign(url);
}
