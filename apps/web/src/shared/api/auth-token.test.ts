import { describe, expect, it } from 'vitest';

import { isUnauthorizedExempt } from './auth-token';

describe('isUnauthorizedExempt', () => {
  it.each(['/api/auth/dev/tokens', '/api/auth/apple', '/api/auth/kakao'])(
    '%s 로그인 요청의 401은 기존 세션 만료로 처리하지 않는다',
    (url) => {
      expect(isUnauthorizedExempt(url)).toBe(true);
    }
  );

  it('일반 인증 요청의 401은 세션 만료 처리 대상이다', () => {
    expect(isUnauthorizedExempt('/api/auth/me')).toBe(false);
  });

  it('요청 URL이 없으면 예외 처리하지 않는다', () => {
    expect(isUnauthorizedExempt(undefined)).toBe(false);
  });
});
