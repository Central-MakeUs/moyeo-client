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
      <span className="font-['Apple_SD_Gothic_Neo',-apple-system,var(--font-suit),sans-serif] text-[15px] leading-normal font-semibold text-[#000000D9]">
        카카오로 시작하기
      </span>
    </button>
  );
}
