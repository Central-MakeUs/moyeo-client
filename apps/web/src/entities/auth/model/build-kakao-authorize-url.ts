export interface KakaoAuthorizeParams {
  clientId: string;
  redirectUri: string;
  state: string;
}

const KAKAO_AUTHORIZE_ENDPOINT = 'https://kauth.kakao.com/oauth/authorize';

export function buildKakaoAuthorizeUrl(params: KakaoAuthorizeParams): string {
  const url = new URL(KAKAO_AUTHORIZE_ENDPOINT);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  return url.toString();
}
