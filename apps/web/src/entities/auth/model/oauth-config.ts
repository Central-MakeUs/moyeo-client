import type { OAuthProvider } from './types';

export type OAuthRedirectTarget = 'local' | 'dev' | 'prod';
export type AppleOAuthRedirectTarget = Exclude<OAuthRedirectTarget, 'local'>;

export function getAppleClientId(): string {
  return process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '';
}

export function getKakaoClientId(): string {
  return process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '';
}

function getOAuthRedirectTarget(): OAuthRedirectTarget {
  const target = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_TARGET?.trim();

  if (target === 'local' || target === 'dev' || target === 'prod') {
    return target;
  }

  throw new Error('NEXT_PUBLIC_OAUTH_REDIRECT_TARGET must be one of "local", "dev", or "prod".');
}

export function getAppleRedirectTarget(): AppleOAuthRedirectTarget {
  const target = getOAuthRedirectTarget();

  if (target === 'local') {
    throw new Error('Apple web login does not support the local redirect target.');
  }

  return target;
}

export function getKakaoRedirectTarget(): OAuthRedirectTarget {
  return getOAuthRedirectTarget();
}

/**
 * 콜백 주소의 기준 origin.
 *
 * `redirect_uri`는 공급자 콘솔에 등록한 값과 문자 단위로 같아야 하므로 환경변수를 정본으로 쓴다.
 * `window.location.origin`을 그대로 쓰면 등록되지 않은 주소가 되는 경우가 있다.
 * - 네이티브 dev 빌드: WebView가 `http://<LAN-IP>:3000`을 띄운다 (Apple은 http redirect_uri를 거부한다)
 * - Vercel preview: 배포마다 `*-git-*.vercel.app` 도메인이 새로 생긴다
 *
 * 환경변수가 없으면 현재 origin으로 폴백한다. (로컬 `localhost:3000` 개발용)
 */
function getRedirectBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  return window.location.origin;
}

export function getRedirectUri(provider: OAuthProvider): string {
  return `${getRedirectBaseUrl()}/auth/callback/${provider}`;
}
