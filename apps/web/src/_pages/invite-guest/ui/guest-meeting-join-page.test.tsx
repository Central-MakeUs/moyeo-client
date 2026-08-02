import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGuestJoinDraft } from '@/features/meeting/invite-participation';

import { GuestMeetingJoinPage } from './guest-meeting-join-page';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('GuestMeetingJoinPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useGuestJoinDraft.setState({ identity: null });
  });

  it('게스트에게 필요한 닉네임과 비밀번호 입력을 표시한다', () => {
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    expect(
      screen.getByRole('heading', { name: '모임에서 사용할 닉네임을 정해주세요' })
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '내 닉네임' })).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('비밀번호에는 숫자만 최대 네 자리까지 유지한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '12a345');

    expect(passwordInput).toHaveValue('1234');
  });

  it('다섯 번째 숫자를 입력해도 비밀번호는 네 자리로 유지한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '12345');

    expect(passwordInput).toHaveValue('1234');
  });

  it('보기 버튼을 누르면 입력값을 유지한 채 비밀번호 표시 상태를 전환한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '1234');
    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveValue('1234');
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(screen.getByRole('button', { name: '비밀번호 숨기기' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('1234');
  });

  it('보기 버튼을 먼저 눌러도 비밀번호를 계속 입력할 수 있다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '1234');

    expect(passwordInput).toHaveValue('1234');
  });

  it('닉네임과 비밀번호가 모두 유효할 때 참여 버튼을 활성화한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '모여');
    await user.type(screen.getByLabelText('비밀번호'), '1234');

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeEnabled();
  });

  it('닉네임만 유효하고 비밀번호가 비어 있으면 참여 버튼을 비활성화한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '소미');

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeDisabled();
  });

  it('숫자가 섞인 닉네임이면 비밀번호가 유효해도 참여 버튼을 비활성화한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '소미1');
    await user.type(screen.getByLabelText('비밀번호'), '1234');

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeDisabled();
  });

  it('참여 버튼을 누르면 신원 정보를 저장하고 모임 유형의 첫 입력 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '모여');
    await user.type(screen.getByLabelText('비밀번호'), '1234');
    await user.click(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' }));

    expect(useGuestJoinDraft.getState().identity).toEqual({
      inviteToken: 'ABC123',
      nickname: '모여',
      password: '1234',
    });
    expect(pushMock).toHaveBeenCalledWith('/i/ABC123/respond/schedule');
  });

  it('뒤로가기를 누르면 현재 초대장 경로로 이동한다', async () => {
    const user = userEvent.setup();
    render(<GuestMeetingJoinPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.click(screen.getByRole('button', { name: '초대장으로 돌아가기' }));

    expect(pushMock).toHaveBeenCalledWith('/i/ABC123');
  });
});
