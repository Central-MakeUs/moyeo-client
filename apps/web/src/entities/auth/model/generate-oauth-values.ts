// crypto.randomUUID는 보안 컨텍스트(HTTPS·localhost)에서만 동작한다.
// IP 접속·일부 WebView 등 비보안 컨텍스트에서는 getRandomValues로 폴백한다.
// webcrypto 자체가 없는 환경에서는 state/nonce를 만들 수 없으므로, 약한 난수로 때우는 대신
// 여기서 끊어 로그인 시도를 실패시킨다. (예측 가능한 state는 CSRF 방어를 무력화한다)
function randomToken(): string {
  if (typeof crypto === 'undefined') {
    throw new Error('crypto를 쓸 수 없어 OAuth state/nonce를 생성할 수 없습니다.');
  }

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
