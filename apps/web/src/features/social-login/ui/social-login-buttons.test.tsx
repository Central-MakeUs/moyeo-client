import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { readOAuthTransaction } from '@/entities/auth';

import { SocialLoginButtons } from './social-login-buttons';

const searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ replace: vi.fn() }),
}));

/**
 * 로그인 시작은 네이티브 지원 여부를 먼저 확인하므로 비동기다. 브라우저(jsdom)에는
 * `window.ReactNativeWebView`가 없어 항상 미지원으로 판정되고 웹 리다이렉트 경로를 탄다.
 *
 * 네이티브 토큰 교환 mutation이 훅 안에 있어 QueryClient가 필요하다. 웹 경로에서는
 * 호출되지 않으므로 실제 클라이언트를 그대로 쓴다.
 */
function renderButtons(props: { next?: string | null } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SocialLoginButtons {...props} />
    </QueryClientProvider>
  );
}

describe('SocialLoginButtons', () => {
  let assignMock: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    searchParams.forEach((_, key) => searchParams.delete(key));
    vi.stubEnv('NEXT_PUBLIC_APPLE_CLIENT_ID', 'com.moyeozo.moyeo.web');
    // stub하지 않으면 로컬 .env의 `local`을 타고 getAppleRedirectTarget()이 throw 한다.
    // Apple 웹 로그인은 local 콜백을 지원하지 않는다.
    vi.stubEnv('NEXT_PUBLIC_OAUTH_REDIRECT_TARGET', 'dev');
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
    delete (window as { ReactNativeWebView?: unknown }).ReactNativeWebView;
    vi.unstubAllGlobals();
  });

  /** 네이티브 WebView 안에서 실행 중인 상황을 만든다. */
  function stubNativeApp(platform: 'ios' | 'android') {
    (window as { ReactNativeWebView?: unknown }).ReactNativeWebView = { postMessage: vi.fn() };
    vi.stubGlobal('navigator', {
      ...window.navigator,
      userAgent:
        platform === 'ios'
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
          : 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36',
    });
  }

  const appleButton = () => screen.queryByRole('button', { name: /Apple로 시작하기/ });
  const kakaoButton = () => screen.queryByRole('button', { name: /카카오로 시작하기/ });

  describe('애플 버튼 노출', () => {
    it('Android 네이티브 앱에서는 애플 버튼이 없고 카카오 버튼만 남는다', async () => {
      stubNativeApp('android');
      renderButtons();

      await waitFor(() => expect(appleButton()).not.toBeInTheDocument());
      expect(kakaoButton()).toBeInTheDocument();
    });

    it('iOS 네이티브 앱에서는 애플 버튼이 그대로 있다', async () => {
      stubNativeApp('ios');
      renderButtons();

      await waitFor(() => expect(appleButton()).toBeInTheDocument());
      expect(kakaoButton()).toBeInTheDocument();
    });

    // 네이티브 앱에서만 숨긴다. iOS에서 애플로 가입한 사용자가 Android로 기변했을 때
    // 모바일 브라우저가 유일한 로그인 경로로 남아야 한다.
    it('Android 브라우저에서는 애플 버튼이 그대로 있다', async () => {
      vi.stubGlobal('navigator', {
        ...window.navigator,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36',
      });
      renderButtons();

      await waitFor(() => expect(appleButton()).toBeInTheDocument());
    });
  });

  it('should render both the Apple and Kakao buttons when rendered', () => {
    renderButtons();

    expect(screen.getByRole('button', { name: /Apple로 시작하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument();
  });

  it('should call window.location.assign once when the Apple button is clicked', async () => {
    renderButtons();

    await userEvent.click(screen.getByRole('button', { name: /Apple로 시작하기/ }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1));
  });

  it('should call window.location.assign once when the Kakao button is clicked', async () => {
    renderButtons();

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1));
  });

  it('should carry the next param into the saved transaction when a button is clicked', async () => {
    searchParams.set('next', '/i/abc123');
    renderButtons();

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    await waitFor(() => expect(readOAuthTransaction()?.next).toBe('/i/abc123'));
  });

  it('should not store an external next param when a button is clicked', async () => {
    searchParams.set('next', 'https://evil.com');
    renderButtons();

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    await waitFor(() => expect(assignMock).toHaveBeenCalled());
    expect(readOAuthTransaction()?.next).toBeUndefined();
  });

  it('next를 prop으로 받고 URL에 next가 없으면 prop 값이 트랜잭션에 실린다', async () => {
    renderButtons({ next: '/i/ABC123' });

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    await waitFor(() => expect(readOAuthTransaction()?.next).toBe('/i/ABC123'));
  });

  it('next prop과 URL의 next가 모두 있으면 prop이 이긴다', async () => {
    searchParams.set('next', '/home');
    renderButtons({ next: '/i/ABC123' });

    await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

    await waitFor(() => expect(readOAuthTransaction()?.next).toBe('/i/ABC123'));
  });

  it('should show a message when the url carries a known error reason', () => {
    searchParams.set('error', 'cancelled');
    renderButtons();

    expect(screen.getByRole('alert')).toHaveTextContent('로그인을 취소했어요.');
  });

  it('should not show a message when the url carries an unknown error reason', () => {
    searchParams.set('error', '<script>alert(1)</script>');
    renderButtons();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
