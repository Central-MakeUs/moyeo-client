import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SocialLoginButtons } from './social-login-buttons';

describe('SocialLoginButtons', () => {
  let assignMock: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_APPLE_CLIENT_ID', 'com.moyeozo.moyeo.web');
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        origin: 'https://moyeo-dev.vercel.app',
        href: 'https://moyeo-dev.vercel.app/login',
        assign: assignMock,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('should render both the Apple and Kakao buttons when rendered', () => {
    render(<SocialLoginButtons />);

    expect(screen.getByRole('button', { name: /Apple로 시작하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument();
  });

  it('should call window.location.assign once when the Apple button is clicked', async () => {
    render(<SocialLoginButtons />);

    await userEvent.click(screen.getByRole('button', { name: /Apple로 시작하기/ }));

    expect(assignMock).toHaveBeenCalledTimes(1);
  });

  it('should call window.location.assign once when the Kakao button is clicked', async () => {
    render(<SocialLoginButtons />);

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    expect(assignMock).toHaveBeenCalledTimes(1);
  });
});
