export interface AppleAuthorizeParams {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}

const APPLE_AUTHORIZE_ENDPOINT = 'https://appleid.apple.com/auth/authorize';

export function buildAppleAuthorizeUrl(params: AppleAuthorizeParams): string {
  const url = new URL(APPLE_AUTHORIZE_ENDPOINT);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);
  return url.toString();
}
