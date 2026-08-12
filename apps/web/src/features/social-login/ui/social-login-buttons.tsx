'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import { NEXT_PARAM } from '@/entities/session';
import { isIOSDevice, isNativeContext } from '@/shared/model';

import { LOGIN_ERROR_PARAM, toLoginErrorMessage } from '../model/login-error';
import { useSocialLogin } from '../model/use-social-login';

import { AppleLoginButton } from './apple-login-button';
import { KakaoLoginButton } from './kakao-login-button';

export interface SocialLoginButtonsProps {
  /**
   * 로그인 후 돌아갈 내부 경로. 넘기지 않으면 URL의 `?next=`를 읽는다.
   * 초대 화면처럼 현재 경로 자체로 복귀해야 하는 경우 prop으로 직접 전달한다.
   */
  next?: string | null;
}

/**
 * 로그인 시작 버튼 묶음.
 *
 * `?next=`는 로그인 후 돌아갈 목적지이고, `?error=`는 직전 시도의 실패 사유다.
 * `?error=`는 URL에서만 읽으므로 `useSearchParams`를 쓰는 이 컴포넌트는 Suspense 안에 있어야 한다.
 *
 * 목적지는 prop이 URL보다 우선한다. 호출부가 명시적으로 넘긴 값이 화면 URL에 남아 있는
 * 파라미터보다 의도가 분명하기 때문이다.
 */
export function SocialLoginButtons({
  next: nextProp,
}: SocialLoginButtonsProps = {}): React.JSX.Element {
  const searchParams = useSearchParams();

  /**
   * 애플 버튼 노출 여부.
   *
   * Android 네이티브 앱에서는 숨긴다. Apple이 Android용 네이티브 SDK를 제공하지 않아 이 경로만
   * WebView OAuth로 남는데, 그 방식은 재로그인마다 재인증을 요구하고 Apple이 권장하지도 않는다.
   * 개선할 수 없는 경로를 선택지로 계속 보여줄 이유가 없다.
   *
   * 브라우저에서는 Android라도 숨기지 않는다. iOS에서 애플로 가입한 사용자가 Android로
   * 기변하면 앱으로는 들어올 수 없는데, 모바일 브라우저가 유일한 탈출구가 된다.
   *
   * 서버 렌더 시점에는 실행 환경을 알 수 없어 마운트 후에 판정한다. 초기값을 `true`로 두는 것은
   * 대다수(브라우저·iOS 앱)가 깜빡임을 겪지 않게 하기 위해서다. Android 앱에서는 버튼이 잠깐
   * 보였다 사라지는데, 이를 완전히 없애려면 페인트 이전에 실행되는 스크립트가 필요하다.
   */
  const [showAppleLogin, setShowAppleLogin] = React.useState(true);

  React.useEffect(() => {
    setShowAppleLogin(!isNativeContext() || isIOSDevice());
  }, []);

  const next = nextProp ?? searchParams.get(NEXT_PARAM);
  const { startLogin, errorMessage } = useSocialLogin(next);

  // 이번 시도의 실패가 직전 시도의 사유(URL `?error=`)보다 우선한다.
  const message = errorMessage ?? toLoginErrorMessage(searchParams.get(LOGIN_ERROR_PARAM));

  return (
    <div className="flex w-full flex-col gap-3">
      {message !== null && (
        <p role="alert" className="text-center text-medium-14 text-primary">
          {message}
        </p>
      )}
      <KakaoLoginButton onClick={() => startLogin('kakao')} />
      {showAppleLogin && <AppleLoginButton onClick={() => startLogin('apple')} />}
    </div>
  );
}
