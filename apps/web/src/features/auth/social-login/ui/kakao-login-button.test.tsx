import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { KakaoLoginButton } from './kakao-login-button';

describe('KakaoLoginButton', () => {
  it('should render the Kakao logo and "카카오로 시작하기" text when rendered', () => {
    const { container } = render(<KakaoLoginButton />);

    expect(screen.getByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
