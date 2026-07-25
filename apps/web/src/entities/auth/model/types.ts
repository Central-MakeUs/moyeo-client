export type OAuthProvider = 'apple' | 'kakao';

export interface OAuthTransaction {
  provider: OAuthProvider;
  state: string;
  nonce?: string; // apple 전용
}

// TODO(orval): 백엔드 요청/응답 DTO — Orval 미도입으로 인한 임시 수기 타입.
// Orval 도입 시 생성 타입으로 교체·제거 예정. (OAuthProvider/OAuthTransaction은 우리 도메인 타입이라 대상 아님)
export interface AppleLoginRequest {
  code: string;
  nonce: string;
}

export interface OnboardingRequest {
  nickname: string;
}

export interface AuthUserResponse {
  id: number;
  nickname: string | null;
  onboardingCompleted: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUserResponse;
}
