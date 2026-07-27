'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import { NEXT_PARAM } from '@/entities/session';

import { LOGIN_ERROR_PARAM, toLoginErrorMessage } from '../model/login-error';
import { startAppleLogin } from '../model/start-apple-login';
import { startKakaoLogin } from '../model/start-kakao-login';

import { AppleLoginButton } from './apple-login-button';
import { KakaoLoginButton } from './kakao-login-button';

/**
 * 로그인 시작 버튼 묶음.
 *
 * `?next=`는 로그인 후 돌아갈 목적지이고, `?error=`는 직전 시도의 실패 사유다.
 * 두 값 모두 URL에서 읽으므로 `useSearchParams`를 쓰는 이 컴포넌트는 Suspense 안에 있어야 한다.
 */
export function SocialLoginButtons(): React.JSX.Element {
  const searchParams = useSearchParams();
  const [startError, setStartError] = React.useState<string | null>(null);

  const next = searchParams.get(NEXT_PARAM);
  const message = startError ?? toLoginErrorMessage(searchParams.get(LOGIN_ERROR_PARAM));

  // start*는 공급자로 페이지를 넘기므로 정상 흐름에서는 반환되지 않는다.
  // 여기서 throw가 올라오면 클릭이 무반응으로 끝나므로 화면에 사유를 남긴다.
  const handleStart = (start: (next?: string | null) => void) => () => {
    setStartError(null);

    try {
      start(next);
    } catch {
      setStartError(toLoginErrorMessage('start_failed'));
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {message !== null && (
        <p role="alert" className="text-center text-medium-14 text-primary">
          {message}
        </p>
      )}
      <KakaoLoginButton onClick={handleStart(startKakaoLogin)} />
      <AppleLoginButton onClick={handleStart(startAppleLogin)} />
    </div>
  );
}
