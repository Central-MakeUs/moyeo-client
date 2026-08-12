import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';

import type { NativeFeature, SocialLoginProvider, SocialLoginResult } from '@repo/types';

/**
 * 이 바이너리가 지원하는 소셜 로그인 공급자
 *
 * 웹은 이 목록에 있는 공급자만 네이티브에 위임하고, 나머지는 기존 웹 OAuth 경로로 처리한다.
 *
 * 애플은 iOS 전용이다. `expo-apple-authentication`의 `isAvailableAsync()`가 iOS·tvOS에서만
 * true를 돌려주므로, Android에서 지원한다고 답하면 웹이 네이티브에 위임했다가 실패한다.
 * Android는 이 목록에서 빠져 기존 애플 웹 OAuth 경로를 그대로 탄다.
 */
export const SUPPORTED_SOCIAL_LOGIN_FEATURES: NativeFeature[] = [
  'socialLogin.kakao',
  ...(Platform.OS === 'ios' ? (['socialLogin.apple'] as const) : []),
];

/**
 * 카카오 SDK가 "사용자 취소"를 알리는 방식
 *
 * 별도 에러 코드를 주지 않고 `KakaoSDKCommon.SdkError 오류 0` 형태의 메시지만 던진다(0이 취소).
 * 문자열 매칭은 취약하지만 SDK가 다른 수단을 제공하지 않는다.
 */
function isUserCancelled(error: unknown): boolean {
  return error instanceof Error && error.message.includes('오류 0');
}

async function requestKakaoToken(): Promise<SocialLoginResult> {
  try {
    const token = await kakaoLogin();
    return { state: 'success', token: token.accessToken };
  } catch (error) {
    if (isUserCancelled(error)) return { state: 'cancelled' };

    // 웹에는 실패했다는 것만 알린다. 원인은 dev 빌드 로그로 남긴다.
    console.warn('Kakao native login failed', error);
    return { state: 'error' };
  }
}

/**
 * 애플이 "사용자 취소"를 알리는 방식
 *
 * `expo-apple-authentication`은 취소 시 `ERR_REQUEST_CANCELED` 코드를 주지만, 플랫폼 버전에
 * 따라 코드 없이 "The user canceled the authorization attempt" 메시지만 오는 경우가 있어
 * 둘 다 본다.
 */
function isAppleCancelled(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const code = (error as { code?: unknown }).code;
  if (code === 'ERR_REQUEST_CANCELED') return true;

  return error instanceof Error && /cancel/i.test(error.message);
}

async function requestAppleToken(nonce?: string): Promise<SocialLoginResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      // Apple은 이 값을 변형 없이 identityToken의 `nonce` 클레임에 담아 돌려준다.
      // 덕분에 서버가 웹 경로와 동일한 규칙으로 검증할 수 있다.
      ...(nonce ? { nonce } : {}),
    });

    if (!credential.identityToken) {
      console.warn('Apple native login returned no identityToken');
      return { state: 'error' };
    }

    return {
      state: 'success',
      token: credential.identityToken,
      // 탈퇴 시 애플 연동 해제(revoke)에 쓸 refresh token을 서버가 확보하려면 필요하다.
      // 이게 없으면 네이티브로 가입한 회원은 탈퇴가 실패한다.
      ...(credential.authorizationCode ? { authorizationCode: credential.authorizationCode } : {}),
    };
  } catch (error) {
    if (isAppleCancelled(error)) return { state: 'cancelled' };

    console.warn('Apple native login failed', error);
    return { state: 'error' };
  }
}

/**
 * 네이티브 SDK로 소셜 로그인을 수행하고 서버 교환에 쓸 토큰을 돌려준다.
 *
 * 웹이 capability를 먼저 확인하고 호출하므로 지원하지 않는 공급자는 도달하지 않지만,
 * 방어적으로 실패를 반환한다.
 *
 * @param provider 로그인할 공급자
 * @param nonce 애플 전용. 웹이 생성해 전달하고 서버가 같은 값으로 검증한다.
 */
export async function requestSocialLogin(
  provider: SocialLoginProvider,
  nonce?: string
): Promise<SocialLoginResult> {
  switch (provider) {
    case 'kakao':
      return requestKakaoToken();

    case 'apple':
      return requestAppleToken(nonce);
  }
}
