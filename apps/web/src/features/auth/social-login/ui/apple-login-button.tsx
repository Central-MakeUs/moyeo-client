import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

export interface AppleLoginButtonProps {
  onClick: () => void;
}

export function AppleLoginButton({ onClick }: AppleLoginButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-8 bg-black text-white"
    >
      <Icon name="apple" size={18} />
      <span className="text-bold-16">Apple로 시작하기</span>
    </button>
  );
}
