'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import { NEXT_PARAM } from '@/entities/session';

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
      <AppleLoginButton onClick={() => startLogin('apple')} />
    </div>
  );
}
