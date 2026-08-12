import { login as kakaoLogin } from '@react-native-seoul/kakao-login';

import type { NativeFeature, SocialLoginProvider, SocialLoginResult } from '@repo/types';

/**
 * 이 바이너리가 지원하는 소셜 로그인 공급자
 *
 * 웹은 이 목록에 있는 공급자만 네이티브에 위임하고, 나머지는 기존 웹 OAuth 경로로 처리한다.
 * 애플은 서버의 네이티브 전용 엔드포인트가 필요해 별도 릴리스로 나가므로(#98) 아직 없다.
 */
export const SUPPORTED_SOCIAL_LOGIN_FEATURES: NativeFeature[] = ['socialLogin.kakao'];

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
 * 네이티브 SDK로 소셜 로그인을 수행하고 서버 교환에 쓸 토큰을 돌려준다.
 *
 * 웹이 capability를 먼저 확인하고 호출하므로 지원하지 않는 공급자는 도달하지 않지만,
 * 방어적으로 실패를 반환한다.
 *
 * @param provider 로그인할 공급자
 * @param _nonce 애플 전용. #98에서 `signInAsync`로 전달한다.
 */
export async function requestSocialLogin(
  provider: SocialLoginProvider,
  _nonce?: string
): Promise<SocialLoginResult> {
  switch (provider) {
    case 'kakao':
      return requestKakaoToken();

    case 'apple':
      console.warn('Apple native login is not implemented in this build');
      return { state: 'error' };
  }
}
