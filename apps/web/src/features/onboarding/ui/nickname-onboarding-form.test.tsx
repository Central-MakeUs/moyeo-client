import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NicknameOnboardingForm } from './nickname-onboarding-form';

const replaceMock = vi.fn();
const mutateMock = vi.fn();
const setQueryDataMock = vi.fn();
let mutationOptions:
  | { mutation?: { onSuccess?: (user: { id: number; nickname: string }) => void } }
  | undefined;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ setQueryData: setQueryDataMock }),
}));

vi.mock('@/shared/api', () => ({
  getMeQueryKey: () => ['/api/auth/me'],
  useCompleteOnboarding: (options: {
    mutation?: { onSuccess?: (user: { id: number; nickname: string }) => void };
  }) => {
    mutationOptions = options;
    return { mutate: mutateMock, isPending: false };
  },
}));

describe('NicknameOnboardingForm', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mutateMock.mockReset();
    setQueryDataMock.mockReset();
    mutationOptions = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('유효한 닉네임을 제출하고 성공하면 사용자 캐시를 갱신한 뒤 홈으로 이동한다', async () => {
    const user = { id: 1, nickname: '모여' };
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모여');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mutateMock).toHaveBeenCalledWith({ data: { nickname: '모여' } });

    mutationOptions?.mutation?.onSuccess?.(user);
    expect(setQueryDataMock).toHaveBeenCalledWith(['/api/auth/me'], user);
    expect(replaceMock).toHaveBeenCalledWith('/home');
  });

  it('빈 값이면 다음 버튼을 비활성화한다', () => {
    render(<NicknameOnboardingForm />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('유효하지 않은 닉네임이면 오류를 표시하고 제출하지 않는다', async () => {
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모여123');

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.getByText(NICKNAME_HINT_FOR_TEST)).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });
});

const NICKNAME_HINT_FOR_TEST = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';
