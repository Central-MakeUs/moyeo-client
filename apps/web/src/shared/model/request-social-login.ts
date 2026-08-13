'use client';

import type { SocialLoginProvider, SocialLoginResult } from '@repo/types';

import { requestNative } from './request-native';

/**
 * 네이티브 소셜 로그인 응답을 기다리는 시간.
 *
 * `requestPickImage`와 같은 이유로 기본값(3초)을 쓸 수 없다. 이 응답은 네이티브가 즉시 만드는
 * 값이 아니라 **사용자가 카카오톡으로 넘어가 동의하거나, 카카오계정으로 로그인하기까지 걸리는
 * 시간**이 그대로 반영된 결과다. 짧게 잡으면 비밀번호를 입력하는 도중에 요청이 끊긴다.
 *
 * 응답이 끝내 오지 않으면 버튼이 대기 상태로 남으므로 무제한으로 두지는 않는다.
 */
const SOCIAL_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * 네이티브 앱에 소셜 로그인을 위임하고 서버 교환에 쓸 토큰을 받는다.
 *
 * WebView 안에서 공급자 authorize 페이지를 직접 띄우면 카카오톡 앱 간 로그인이 되지 않고
 * 매번 재인증을 요구한다. 네이티브 SDK는 앱 전환으로 그 마찰을 없앤다.
 *
 * 호출 전에 `supportsNativeFeature()`로 지원 여부를 확인해야 한다. 구버전 바이너리는 이 요청에
 * 응답하지 않아 제한 시간까지 대기하게 된다.
 *
 * @param provider 로그인할 공급자
 * @param nonce 애플 전용. Apple이 identityToken의 `nonce` 클레임에 그대로 담아 돌려준다.
 * @returns 로그인 결과. 성공 외에 취소·실패를 구분해 돌려준다.
 * @throws 브리지를 쓸 수 없거나 제한 시간 안에 응답이 없으면 reject한다.
 */
export async function requestSocialLogin(
  provider: SocialLoginProvider,
  nonce?: string
): Promise<SocialLoginResult> {
  const response = await requestNative(
    { type: 'SOCIAL_LOGIN', payload: { provider, ...(nonce ? { nonce } : {}) } },
    'SOCIAL_LOGIN_RESULT',
    { timeoutMs: SOCIAL_LOGIN_TIMEOUT_MS }
  );

  return response.payload;
}
