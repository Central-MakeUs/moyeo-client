'use client';

import * as React from 'react';

import { startAppleLogin } from '../model/start-apple-login';
import { startKakaoLogin } from '../model/start-kakao-login';

import { AppleLoginButton } from './apple-login-button';
import { KakaoLoginButton } from './kakao-login-button';

export function SocialLoginButtons(): React.JSX.Element {
  return (
    <div className="flex w-full flex-col gap-3">
      <KakaoLoginButton onClick={startKakaoLogin} />
      <AppleLoginButton onClick={startAppleLogin} />
    </div>
  );
}
