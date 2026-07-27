import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { readOAuthTransaction } from '@/entities/auth';

import { SocialLoginButtons } from './social-login-buttons';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

describe('SocialLoginButtons', () => {
  let assignMock: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    searchParams.forEach((_, key) => searchParams.delete(key));
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

  it('should carry the next param into the saved transaction when a button is clicked', async () => {
    searchParams.set('next', '/i/abc123');
    render(<SocialLoginButtons />);

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    expect(readOAuthTransaction()?.next).toBe('/i/abc123');
  });

  it('should not store an external next param when a button is clicked', async () => {
    searchParams.set('next', 'https://evil.com');
    render(<SocialLoginButtons />);

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    expect(readOAuthTransaction()?.next).toBeUndefined();
  });

  it('should show a message when the url carries a known error reason', () => {
    searchParams.set('error', 'cancelled');
    render(<SocialLoginButtons />);

    expect(screen.getByRole('alert')).toHaveTextContent('로그인을 취소했어요.');
  });

  it('should not show a message when the url carries an unknown error reason', () => {
    searchParams.set('error', '<script>alert(1)</script>');
    render(<SocialLoginButtons />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
