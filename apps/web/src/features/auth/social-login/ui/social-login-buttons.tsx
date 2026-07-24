import * as React from 'react';

import { useSocialLogin } from '../model/use-social-login';

import { AppleLoginButton } from './apple-login-button';
import { KakaoLoginButton } from './kakao-login-button';

export function SocialLoginButtons(): React.JSX.Element {
  const { startAppleLogin } = useSocialLogin();

  return (
    <div className="flex w-full flex-col gap-3">
      <KakaoLoginButton />
      <AppleLoginButton onClick={startAppleLogin} />
    </div>
  );
}
