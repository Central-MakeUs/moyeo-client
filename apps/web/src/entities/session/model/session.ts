import type { AuthResponse, AuthUserResponse } from '@/shared/api';

/**
 * 세션에서 파생되는 현재 사용자 정보.
 * 저장 대상이 아니며 `GET /api/auth/me` 결과에서 만든다.
 */
export interface SessionViewer {
  id: number;
  nickname: string | null;
  onboardingCompleted: boolean;
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'error'; retry: () => void }
  | { status: 'authenticated'; accessToken: string; viewer: SessionViewer };

/**
 * 생성 타입 `AuthResponse`는 모든 필드가 optional이므로 토큰이 없으면 세션을 만들지 않는다.
 */
export function toAccessToken(auth: AuthResponse | undefined | null): string | null {
  const accessToken = auth?.accessToken?.trim();
  return accessToken ? accessToken : null;
}

/**
 * 필수 필드가 빠진 응답은 뷰어로 취급하지 않는다. 호출부는 `me`를 다시 조회해야 한다.
 */
export function toSessionViewer(user: AuthUserResponse | undefined | null): SessionViewer | null {
  if (!user || typeof user.id !== 'number' || typeof user.onboardingCompleted !== 'boolean') {
    return null;
  }

  // 온보딩을 완료했는데 닉네임이 없는 경우
  if (!user.nickname && user.onboardingCompleted) return null;

  return {
    id: user.id,
    nickname: user.nickname ?? null,
    onboardingCompleted: user.onboardingCompleted,
  };
}
