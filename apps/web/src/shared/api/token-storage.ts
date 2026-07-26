const STORAGE_KEY = 'moyeo.auth.token';

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

// SSR-safe: 서버(window 없음)에서는 null을 반환한다.
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
