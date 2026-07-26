import {
  buildKakaoAuthorizeUrl,
  generateState,
  getKakaoClientId,
  getRedirectUri,
  saveOAuthTransaction,
} from '@/entities/auth';

export function startKakaoLogin(): void {
  const state = generateState();

  saveOAuthTransaction({ provider: 'kakao', state });

  const url = buildKakaoAuthorizeUrl({
    clientId: getKakaoClientId(),
    redirectUri: getRedirectUri('kakao'),
    state,
  });

  window.location.assign(url);
}
