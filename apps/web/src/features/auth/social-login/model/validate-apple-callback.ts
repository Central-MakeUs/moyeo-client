import type { OAuthTransaction } from '@/entities/auth';

export interface AppleCallbackParams {
  code: string | null;
  state: string | null;
  error?: string | null;
}

export type AppleCallbackResult =
  | { status: 'ready'; code: string; nonce: string }
  | { status: 'error'; reason: 'cancelled' | 'state_mismatch' | 'no_code' };

// 콜백 파라미터 + 저장된 트랜잭션으로 애플 토큰 교환 가능 여부를 검증한다.
// - error 파라미터 있음(사용자 취소 등) → cancelled
// - 저장 state와 불일치(CSRF 방어) → state_mismatch
// - code 없음 → no_code
// - 모두 통과 → 교환에 쓸 code·nonce
export function validateAppleCallback(
  params: AppleCallbackParams,
  transaction: OAuthTransaction | null
): AppleCallbackResult {
  if (params.error) {
    return { status: 'error', reason: 'cancelled' };
  }
  if (!transaction || !params.state || params.state !== transaction.state) {
    return { status: 'error', reason: 'state_mismatch' };
  }
  if (!params.code) {
    return { status: 'error', reason: 'no_code' };
  }
  return { status: 'ready', code: params.code, nonce: transaction.nonce ?? '' };
}
