import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

export interface KakaoLoginButtonProps {
  onClick?: () => void;
}

export function KakaoLoginButton({ onClick }: KakaoLoginButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-8 bg-[#FEE500]"
    >
      <Icon name="kakao" size={18} className="text-black" />
      <span className="text-bold-16 text-black/85">카카오로 시작하기</span>
    </button>
  );
}
