import { isAxiosError } from 'axios';

import { buildLoginPath } from '@/entities/session';

/**
 * 소셜 로그인 실패 사유.
 *
 * OAuth 콜백은 성공하든 실패하든 화면에 남지 않고 이동하므로, 실패 사유를 로그인 화면으로
 * 넘겨 사용자가 "왜 안 됐는지" 알 수 있게 한다. (WebView에서 빈 화면·무반응으로 끝나면
 * 사용자는 앱이 죽은 것으로 받아들인다)
 */
export type LoginErrorReason =
  | 'cancelled' // 사용자가 공급자 화면에서 취소
  | 'state_mismatch' // 저장한 state와 불일치 (CSRF 방어 또는 트랜잭션 유실)
  | 'no_code' // 공급자가 인가 코드를 주지 않음
  | 'timed_out' // 토큰 교환이 제한 시간 안에 끝나지 않음
  | 'exchange_failed' // 서버 토큰 교환 실패
  | 'start_failed' // 로그인 시작 자체가 실패 (state/nonce 생성 불가 등)
  | 'unsupported_provider'; // 지원하지 않는 공급자 경로

export const LOGIN_ERROR_PARAM = 'error';

const MESSAGES: Record<LoginErrorReason, string> = {
  cancelled: '로그인을 취소했어요.',
  state_mismatch: '로그인 요청이 만료됐어요. 다시 시도해 주세요.',
  no_code: '로그인 정보를 받지 못했어요. 다시 시도해 주세요.',
  timed_out: '로그인 처리 시간이 초과됐어요. 네트워크 연결을 확인하고 다시 시도해 주세요.',
  exchange_failed: '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
  start_failed: '로그인을 시작하지 못했어요. 다시 시도해 주세요.',
  unsupported_provider: '지원하지 않는 로그인 방식이에요.',
};

function isLoginErrorReason(value: string): value is LoginErrorReason {
  return value in MESSAGES;
}

/** 알 수 없는 값이면 `null`을 돌려 아무것도 렌더하지 않는다. (URL로 임의 문구를 넣지 못하게) */
export function toLoginErrorMessage(reason: string | null | undefined): string | null {
  if (!reason || !isLoginErrorReason(reason)) return null;

  return MESSAGES[reason];
}

/**
 * 토큰 교환 실패를 사유로 분류한다.
 *
 * 응답이 오지 않아 끊긴 경우와 서버가 거절한 경우는 사용자가 할 일이 다르다 — 전자는 네트워크를
 * 확인하고 재시도, 후자는 잠시 후 재시도다. 웹 콜백과 네이티브 SDK 경로가 같은 기준으로
 * 판단하도록 여기 둔다.
 */
export function toExchangeErrorReason(error: unknown): LoginErrorReason {
  const isTimeout =
    isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');

  return isTimeout ? 'timed_out' : 'exchange_failed';
}

/**
 * 콜백에서 로그인 화면으로 돌아갈 경로. 재시도해도 목적지를 잃지 않도록 `next`를 함께 보존한다.
 */
export function buildLoginFailurePath(reason: LoginErrorReason, next?: string | null): string {
  const loginPath = buildLoginPath(next);
  const separator = loginPath.includes('?') ? '&' : '?';

  return `${loginPath}${separator}${LOGIN_ERROR_PARAM}=${reason}`;
}
