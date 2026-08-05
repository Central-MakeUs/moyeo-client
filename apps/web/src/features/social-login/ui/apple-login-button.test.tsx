import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppleLoginButton } from './apple-login-button';

describe('AppleLoginButton', () => {
  it('should render the Apple logo and "Apple로 시작하기" text when rendered', () => {
    const { container } = render(<AppleLoginButton onClick={() => {}} />);

    expect(screen.getByRole('button', { name: /Apple로 시작하기/ })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should call onClick once when clicked', async () => {
    const onClick = vi.fn();
    render(<AppleLoginButton onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: /Apple로 시작하기/ }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
