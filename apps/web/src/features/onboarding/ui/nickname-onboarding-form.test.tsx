import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { putOnboarding } from '@/entities/auth';

import { NicknameOnboardingForm } from './nickname-onboarding-form';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/entities/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/auth')>();
  return { ...actual, putOnboarding: vi.fn() };
});

const ONBOARDING_RESPONSE = { id: 1, nickname: '모여', onboardingCompleted: true };

describe('NicknameOnboardingForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(putOnboarding).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call putOnboarding({ nickname: '모여' }) and router.push('/home') when submitting a valid nickname", async () => {
    vi.mocked(putOnboarding).mockResolvedValue(ONBOARDING_RESPONSE);
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모여');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(putOnboarding).toHaveBeenCalledWith({ nickname: '모여' });
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

  it('should not call router.push when putOnboarding rejects', async () => {
    vi.mocked(putOnboarding).mockRejectedValue(new Error('network'));
    render(<NicknameOnboardingForm />);

    await userEvent.type(screen.getByRole('textbox'), '모여');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(pushMock).not.toHaveBeenCalled();
  });
});
