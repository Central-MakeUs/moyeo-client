// crypto.randomUUID는 보안 컨텍스트(HTTPS·localhost)에서만 동작한다.
// IP 접속·일부 WebView 등 비보안 컨텍스트에서는 getRandomValues로 폴백한다.
function randomToken(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function generateState(): string {
  return randomToken();
}

export function generateNonce(): string {
  return randomToken();
}
