import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OAuthCallbackPage } from './oauth-callback';

const mocks = vi.hoisted(() => ({
  provider: 'apple',
  replace: vi.fn(),
  transaction: { provider: 'apple', state: 'state-1', nonce: 'nonce-1' } as {
    provider: 'apple';
    state: string;
    nonce: string;
    next?: string;
  } | null,
  getAppleRedirectTarget: vi.fn(() => 'prod' as const),
  clearOAuthTransaction: vi.fn(),
  setSessionToken: vi.fn(),
  queryClear: vi.fn(),
  setQueryData: vi.fn(),
  exchangeApple: vi.fn(),
  appleMutation: undefined as
    | { onSuccess?: (data: unknown) => void; onError?: (error: unknown) => void }
    | undefined,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ provider: mocks.provider }),
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams('code=apple-code&state=state-1'),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ clear: mocks.queryClear, setQueryData: mocks.setQueryData }),
}));

vi.mock('@/entities/auth', () => ({
  clearOAuthTransaction: mocks.clearOAuthTransaction,
  getAppleRedirectTarget: mocks.getAppleRedirectTarget,
  getKakaoRedirectTarget: vi.fn(() => 'prod'),
  readOAuthTransaction: () => mocks.transaction,
}));

vi.mock('@/entities/session', () => ({
  setSessionToken: mocks.setSessionToken,
  toAccessToken: (auth: { accessToken?: string } | undefined) => auth?.accessToken?.trim() || null,
  toSessionViewer: (user: unknown) => user,
}));

vi.mock('@/features/social-login', () => ({
  buildLoginFailurePath: (reason: string) => `/login?error=${reason}`,
  toLoginErrorMessage: (reason: string) =>
    reason === 'timed_out' ? '로그인 처리 시간이 초과됐어요.' : '로그인에 실패했어요.',
  resolvePostLoginPath: (user: { onboardingCompleted?: boolean } | undefined) =>
    user?.onboardingCompleted ? '/' : '/nickname',
  validateAppleCallback: (
    params: { code: string | null; state: string | null },
    transaction: { state: string; nonce?: string } | null
  ) =>
    transaction && params.code && params.state === transaction.state
      ? { status: 'ready', code: params.code, nonce: transaction.nonce ?? '' }
      : { status: 'error', reason: 'state_mismatch' },
  validateKakaoCallback: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  getMeQueryKey: () => ['/api/auth/me'],
  useLoginApple: (options: { mutation?: typeof mocks.appleMutation }) => {
    mocks.appleMutation = options.mutation;
    return { mutate: mocks.exchangeApple };
  },
  useLoginKakao: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/shared/ui/app-splash', () => ({
  AppSplash: () => <div role="status">로그인 처리 중</div>,
}));

describe('OAuthCallbackPage Apple 로그인', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    mocks.provider = 'apple';
    mocks.transaction = { provider: 'apple', state: 'state-1', nonce: 'nonce-1' };
    mocks.getAppleRedirectTarget.mockReturnValue('prod');
    mocks.appleMutation = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('토큰 교환이 pending인 동안 처리 중 화면을 표시한다', async () => {
    render(<OAuthCallbackPage />);

    await waitFor(() => expect(mocks.exchangeApple).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toHaveTextContent('로그인 처리 중');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it.each(['4xx 응답', '5xx 응답'])(
    '%s이면 실패 사유와 함께 로그인 화면으로 돌아간다',
    async () => {
      render(<OAuthCallbackPage />);
      await waitFor(() => expect(mocks.appleMutation).toBeDefined());

      mocks.appleMutation?.onError?.(new Error('exchange failed'));

      expect(mocks.clearOAuthTransaction).toHaveBeenCalled();
      expect(mocks.replace).toHaveBeenCalledWith('/login?error=exchange_failed');
      expect(await screen.findByRole('alert')).toHaveTextContent('로그인에 실패했어요.');
      expect(screen.getByRole('button', { name: '로그인으로 돌아가기' })).toBeInTheDocument();
    }
  );

  it('Axios timeout이면 timed_out 사유와 함께 로그인 화면으로 돌아간다', async () => {
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());

    mocks.appleMutation?.onError?.(
      Object.assign(new Error('timeout'), { isAxiosError: true, code: 'ECONNABORTED' })
    );

    expect(mocks.replace).toHaveBeenCalledWith('/login?error=timed_out');
    expect(await screen.findByRole('alert')).toHaveTextContent('로그인 처리 시간이 초과됐어요.');
  });

  it('오프라인으로 로그인 화면 이동이 끝나지 않아도 callback 자체가 실패 화면을 유지한다', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());

    mocks.appleMutation?.onError?.(new Error('Network Error'));

    expect(await screen.findByRole('alert')).toHaveTextContent('로그인에 실패했어요.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('교환 mutation이 settle되지 않으면 20초 watchdog이 timed_out으로 확정한다', async () => {
    vi.useFakeTimers();
    render(<OAuthCallbackPage />);
    await act(async () => {});
    expect(mocks.exchangeApple).toHaveBeenCalledOnce();

    await act(async () => vi.advanceTimersByTimeAsync(20_000));

    expect(mocks.replace).toHaveBeenCalledWith('/login?error=timed_out');
  });

  it('watchdog 이후 늦게 도착한 성공 응답은 세션과 화면을 덮어쓰지 않는다', async () => {
    vi.useFakeTimers();
    render(<OAuthCallbackPage />);
    await act(async () => {});

    await act(async () => vi.advanceTimersByTimeAsync(20_000));
    mocks.appleMutation?.onSuccess?.({
      accessToken: 'late-token',
      user: { id: 1, nickname: '모여', onboardingCompleted: true },
    });

    expect(mocks.setSessionToken).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledWith('/login?error=timed_out');
  });

  it('잘못된 OAuth 환경 설정이 throw해도 처리 화면에 고착되지 않는다', async () => {
    mocks.getAppleRedirectTarget.mockImplementation(() => {
      throw new Error('invalid redirect target');
    });

    render(<OAuthCallbackPage />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login?error=exchange_failed'));
    expect(mocks.exchangeApple).not.toHaveBeenCalled();
  });

  it('기존 회원이면 토큰을 저장하고 기본 화면으로 이동한다', async () => {
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());

    mocks.appleMutation?.onSuccess?.({
      accessToken: 'access-token',
      user: { id: 1, nickname: '모여', onboardingCompleted: true },
    });

    expect(mocks.queryClear).toHaveBeenCalled();
    expect(mocks.setSessionToken).toHaveBeenCalledWith('access-token');
    expect(mocks.setQueryData).toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });

  it('신규 회원이면 토큰을 저장하고 닉네임 화면으로 이동한다', async () => {
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());

    mocks.appleMutation?.onSuccess?.({
      accessToken: 'access-token',
      user: { id: 2, nickname: null, onboardingCompleted: false },
    });

    expect(mocks.setSessionToken).toHaveBeenCalledWith('access-token');
    expect(mocks.replace).toHaveBeenCalledWith('/nickname');
  });

  it('로그인 성공 시 이미 오프라인이면 토큰은 유지하고 화면 이동 실패를 안내한다', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());

    mocks.appleMutation?.onSuccess?.({
      accessToken: 'access-token',
      user: { id: 1, nickname: '모여', onboardingCompleted: true },
    });

    expect(mocks.setSessionToken).toHaveBeenCalledWith('access-token');
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그인은 완료됐지만 화면을 불러오지 못했어요.'
    );
  });

  it('로그인 성공 후 RSC 화면 전환이 10초간 끝나지 않으면 복구 화면을 표시한다', async () => {
    vi.useFakeTimers();
    render(<OAuthCallbackPage />);
    await act(async () => {});

    await act(async () => {
      mocks.appleMutation?.onSuccess?.({
        accessToken: 'access-token',
        user: { id: 1, nickname: '모여', onboardingCompleted: true },
      });
    });
    expect(mocks.replace).toHaveBeenCalledWith('/');

    await act(async () => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '로그인은 완료됐지만 화면을 불러오지 못했어요.'
    );
  });

  it('연결 복구 후 화면 이동만 다시 시도하고 OAuth 교환은 반복하지 않는다', async () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());
    mocks.appleMutation?.onSuccess?.({
      accessToken: 'access-token',
      user: { id: 1, nickname: '모여', onboardingCompleted: true },
    });
    await screen.findByRole('alert');

    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: '화면 다시 불러오기' }));

    expect(mocks.replace).toHaveBeenCalledWith('/');
    expect(mocks.exchangeApple).toHaveBeenCalledTimes(1);
  });

  it('200 응답에 토큰이 없으면 세션을 만들지 않고 실패 처리한다', async () => {
    render(<OAuthCallbackPage />);
    await waitFor(() => expect(mocks.appleMutation).toBeDefined());

    mocks.appleMutation?.onSuccess?.({ user: { id: 1, onboardingCompleted: true } });

    expect(mocks.setSessionToken).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/login?error=exchange_failed');
  });
});
