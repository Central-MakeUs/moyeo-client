export type OAuthProvider = 'apple' | 'kakao';

export interface OAuthTransaction {
  provider: OAuthProvider;
  state: string;
  nonce?: string; // apple 전용
}
