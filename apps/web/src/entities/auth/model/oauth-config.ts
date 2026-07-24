import type { OAuthProvider } from './types';

export function getAppleClientId(): string {
  return process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '';
}

export function getRedirectUri(provider: OAuthProvider): string {
  return `${window.location.origin}/auth/callback/${provider}`;
}
