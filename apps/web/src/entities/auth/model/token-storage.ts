const STORAGE_KEY = 'moyeo.auth.token';

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
