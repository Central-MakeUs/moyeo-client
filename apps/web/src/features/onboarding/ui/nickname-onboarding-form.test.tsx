import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NicknameOnboardingForm } from './nickname-onboarding-form';

const pushMock = vi.fn();
const mutateMock = vi.fn();
let mutationOptions: { mutation?: { onSuccess?: () => void } } | undefined;

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/shared/api', () => ({
  useCompleteOnboarding: (options: { mutation?: { onSuccess?: () => void } }) => {
    mutationOptions = options;
    return { mutate: mutateMock, isPending: false };
  },
}));

describe('NicknameOnboardingForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mutateMock.mockReset();
    mutationOptions = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should mutate with { nickname: '모여' } and navigate to '/home' on success when submitting a valid nickname", async () => {
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모여');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mutateMock).toHaveBeenCalledWith({ data: { nickname: '모여' } });

    // 뮤테이션 성공 콜백이 홈으로 이동시킨다
    mutationOptions?.mutation?.onSuccess?.();
    expect(pushMock).toHaveBeenCalledWith('/home');
  });

  it("should disable the '다음' button initially when value is empty", () => {
    render(<NicknameOnboardingForm />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("should disable '다음' and show the error message when nickname is invalid", async () => {
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모여123');

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.getByText('* 2~10자로 공백없이 한글과 영어만 입력해주세요')).toBeInTheDocument();
  });

  it("should not mutate when the '다음' button is clicked with an invalid nickname", async () => {
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(mutateMock).not.toHaveBeenCalled();
  });
});
