import type { OAuthTransaction } from './types';

const STORAGE_KEY = 'moyeo.oauth.transaction';

export function saveOAuthTransaction(tx: OAuthTransaction): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tx));
}

export function readOAuthTransaction(): OAuthTransaction | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  try {
    return JSON.parse(raw) as OAuthTransaction;
  } catch {
    return null;
  }
}

export function clearOAuthTransaction(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
