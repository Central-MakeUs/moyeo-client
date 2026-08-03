import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGuestJoinDraft } from '@/features/meeting/invite-participation';

import { GuestEntryPage } from './guest-entry-page';

const pushMock = vi.fn();

const { checkGuestEntry, joinGuest } = vi.hoisted(() => ({
  checkGuestEntry: vi.fn(),
  joinGuest: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  checkGuestEntry,
  joinGuest,
}));

const PASSWORD_MISMATCH_MESSAGE = '비밀번호가 일치하지 않아요';

/** 실제 axios 오류와 같은 모양. 훅은 `response.status`로 409를 가른다. */
const httpError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status } });

/** 응답 도착 시점을 테스트가 제어하기 위한 지연 Promise. */
function defer<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/** 유효한 신원을 채우고 CTA를 누른다. */
async function submitEntry(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '소미');
  await user.type(screen.getByLabelText('비밀번호'), '1234');
  await user.click(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' }));
}

describe('GuestEntryPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    checkGuestEntry.mockReset();
    checkGuestEntry.mockResolvedValue({ entryType: 'NEW_GUEST' });
    joinGuest.mockReset();
    useGuestJoinDraft.setState({ identity: null });
  });

  it('게스트에게 필요한 닉네임과 비밀번호 입력을 표시한다', () => {
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

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
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '12a345');

    expect(passwordInput).toHaveValue('1234');
  });

  it('다섯 번째 숫자를 입력해도 비밀번호는 네 자리로 유지한다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '12345');

    expect(passwordInput).toHaveValue('1234');
  });

  it('보기 버튼을 누르면 입력값을 유지한 채 비밀번호 표시 상태를 전환한다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

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
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.click(screen.getByRole('button', { name: '비밀번호 보기' }));
    const passwordInput = screen.getByLabelText('비밀번호');
    await user.type(passwordInput, '1234');

    expect(passwordInput).toHaveValue('1234');
  });

  it('닉네임과 비밀번호가 모두 유효할 때 참여 버튼을 활성화한다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '모여');
    await user.type(screen.getByLabelText('비밀번호'), '1234');

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeEnabled();
  });

  it('닉네임만 유효하고 비밀번호가 비어 있으면 참여 버튼을 비활성화한다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '소미');

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeDisabled();
  });

  it('숫자가 섞인 닉네임이면 비밀번호가 유효해도 참여 버튼을 비활성화한다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.type(screen.getByRole('textbox', { name: '내 닉네임' }), '소미1');
    await user.type(screen.getByLabelText('비밀번호'), '1234');

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeDisabled();
  });

  it('뒤로가기를 누르면 현재 초대장 경로로 이동한다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await user.click(screen.getByRole('button', { name: '초대장으로 돌아가기' }));

    expect(pushMock).toHaveBeenCalledWith('/i/ABC123');
  });

  it('CTA를 탭하면 checkGuestEntry가 초대 코드와 입력한 신원으로 한 번 호출된다', async () => {
    const user = userEvent.setup();
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    expect(checkGuestEntry).toHaveBeenCalledTimes(1);
    expect(checkGuestEntry).toHaveBeenCalledWith('ABC123', {
      nickname: '소미',
      password: '1234',
    });
  });

  it('NEW_GUEST 응답이면 초안에 신원이 저장되고 참여 입력 첫 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    const entry = defer<unknown>();
    checkGuestEntry.mockReturnValue(entry.promise);
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    // 분기 결과를 받기 전에 이동하면 EXISTING_GUEST를 현황으로 보낼 수 없다.
    expect(pushMock).not.toHaveBeenCalled();

    entry.resolve({ entryType: 'NEW_GUEST' });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/i/ABC123/respond/schedule'));
    expect(useGuestJoinDraft.getState().identity).toEqual({
      inviteToken: 'ABC123',
      nickname: '소미',
      password: '1234',
    });
  });

  it('EXISTING_GUEST 응답이면 모임 현황으로 이동하고 joinGuest는 호출되지 않는다', async () => {
    const user = userEvent.setup();
    checkGuestEntry.mockResolvedValue({ entryType: 'EXISTING_GUEST' });
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/meetings?code=ABC123'));
    expect(joinGuest).not.toHaveBeenCalled();
  });

  it('EXISTING_GUEST 응답이면 초안에 신원이 저장되지 않는다', async () => {
    const user = userEvent.setup();
    checkGuestEntry.mockResolvedValue({ entryType: 'EXISTING_GUEST' });
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(useGuestJoinDraft.getState().identity).toBeNull();
  });

  it('분기 요청이 진행 중일 때 CTA를 두 번 더 탭해도 checkGuestEntry는 한 번만 호출된다', async () => {
    const user = userEvent.setup();
    const entry = defer<unknown>();
    checkGuestEntry.mockReturnValue(entry.promise);
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);
    const cta = screen.getByRole('button', { name: '이번에만 게스트로 참여하기' });
    await user.click(cta);
    await user.click(cta);

    expect(checkGuestEntry).toHaveBeenCalledTimes(1);
  });

  it('분기 요청이 진행 중이면 CTA가 disabled다', async () => {
    const user = userEvent.setup();
    const entry = defer<unknown>();
    checkGuestEntry.mockReturnValue(entry.promise);
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeDisabled();
  });

  it('409를 받으면 비밀번호가 일치하지 않는다는 안내가 보이고 이동하지 않는다', async () => {
    const user = userEvent.setup();
    checkGuestEntry.mockRejectedValue(httpError(409));
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    expect(await screen.findByText(PASSWORD_MISMATCH_MESSAGE)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('409를 받은 뒤 비밀번호를 고치면 안내가 사라진다', async () => {
    const user = userEvent.setup();
    checkGuestEntry.mockRejectedValue(httpError(409));
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);
    expect(await screen.findByText(PASSWORD_MISMATCH_MESSAGE)).toBeInTheDocument();

    // 4자리가 꽉 차 있어 새 숫자는 maxLength에 막힌다. 실제 사용자처럼 지워서 값을 바꾼다.
    await user.type(screen.getByLabelText('비밀번호'), '{backspace}');

    expect(screen.queryByText(PASSWORD_MISMATCH_MESSAGE)).not.toBeInTheDocument();
  });

  it('500을 받으면 이동하지 않고 인라인 안내도 보이지 않으며 CTA가 다시 활성이다', async () => {
    const user = userEvent.setup();
    checkGuestEntry.mockRejectedValue(httpError(500));
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeEnabled()
    );
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByText(PASSWORD_MISMATCH_MESSAGE)).not.toBeInTheDocument();
  });

  it('응답을 해석할 수 없으면 이동하지 않는다', async () => {
    const user = userEvent.setup();
    checkGuestEntry.mockResolvedValue({ entryType: 'UNKNOWN' });
    render(<GuestEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await submitEntry(user);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '이번에만 게스트로 참여하기' })).toBeEnabled()
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
