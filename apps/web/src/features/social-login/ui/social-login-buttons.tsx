'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import { NEXT_PARAM } from '@/entities/session';

import { LOGIN_ERROR_PARAM, toLoginErrorMessage } from '../model/login-error';
import { startAppleLogin } from '../model/start-apple-login';
import { startKakaoLogin } from '../model/start-kakao-login';

import { AppleLoginButton } from './apple-login-button';
import { KakaoLoginButton } from './kakao-login-button';

export interface SocialLoginButtonsProps {
  /**
   * 로그인 후 돌아갈 내부 경로. 넘기지 않으면 URL의 `?next=`를 읽는다.
   * 초대 화면처럼 현재 경로 자체로 복귀해야 하는 경우 prop으로 직접 전달한다.
   */
  next?: string | null;
}

type StartLogin = (next?: string | null) => void;

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
  const [loginStartErrorMessage, setLoginStartErrorMessage] = React.useState<string | null>(null);

  const next = nextProp ?? searchParams.get(NEXT_PARAM);
  const message =
    loginStartErrorMessage ?? toLoginErrorMessage(searchParams.get(LOGIN_ERROR_PARAM));

  // startKakaoLogin·startAppleLogin은 공급자 페이지로 넘기므로 정상 흐름에서는 반환되지 않는다.
  // 여기서 throw가 올라오면 클릭이 무반응으로 끝나므로 화면에 사유를 남긴다.
  const createLoginStartHandler = (startLogin: StartLogin) => () => {
    setLoginStartErrorMessage(null);

    try {
      startLogin(next);
    } catch {
      setLoginStartErrorMessage(toLoginErrorMessage('start_failed'));
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {message !== null && (
        <p role="alert" className="text-center text-medium-14 text-primary">
          {message}
        </p>
      )}
      <KakaoLoginButton onClick={createLoginStartHandler(startKakaoLogin)} />
      <AppleLoginButton onClick={createLoginStartHandler(startAppleLogin)} />
    </div>
  );
}
