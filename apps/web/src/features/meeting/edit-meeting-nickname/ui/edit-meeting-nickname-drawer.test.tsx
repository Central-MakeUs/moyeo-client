import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditMeetingNicknameDrawer } from './edit-meeting-nickname-drawer';

const NICKNAME_LABEL = '모임별 닉네임';
const SUBMIT_LABEL = '완료';

function renderDrawer(props: Partial<React.ComponentProps<typeof EditMeetingNicknameDrawer>> = {}) {
  return render(
    <EditMeetingNicknameDrawer open onOpenChange={vi.fn()} onSubmit={vi.fn()} {...props} />
  );
}

async function findInput() {
  return screen.findByLabelText(NICKNAME_LABEL);
}

describe('EditMeetingNicknameDrawer', () => {
  it('열릴 때 지금 쓰는 닉네임으로 채운다', async () => {
    renderDrawer({ currentNickname: '소미' });

    expect(await findInput()).toHaveValue('소미');
  });

  it('바꾼 게 없으면 완료를 잠근다', async () => {
    renderDrawer({ currentNickname: '소미' });

    await findInput();
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
  });

  it('닉네임을 바꾸면 완료가 열린다', async () => {
    const user = userEvent.setup();
    renderDrawer({ currentNickname: '소미' });

    await user.type(await findInput(), '모여');

    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeEnabled();
  });

  it('바꿨다가 원래 닉네임으로 되돌리면 완료를 다시 잠근다', async () => {
    const user = userEvent.setup();
    renderDrawer({ currentNickname: '소미' });

    const input = await findInput();
    await user.type(input, '모여');
    await user.clear(input);
    await user.type(input, '소미');

    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
  });

  it('아직 닉네임을 모르면 빈 입력으로 두고 완료를 잠근다', async () => {
    renderDrawer({ currentNickname: null });

    expect(await findInput()).toHaveValue('');
    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
  });

  it('규칙에 맞지 않는 닉네임에는 안내 문구를 보여주고 완료를 잠근 채로 둔다', async () => {
    const user = userEvent.setup();
    renderDrawer({ currentNickname: '소미' });

    const input = await findInput();
    await user.clear(input);
    await user.type(input, '모');

    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
    expect(screen.getByText(/2~10자로 공백없이 한글과 영어만/)).toBeInTheDocument();
  });

  it('규칙에 맞는 새 닉네임을 완료로 넘긴다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderDrawer({ currentNickname: '소미', onSubmit });

    const input = await findInput();
    await user.clear(input);
    await user.type(input, '모여');
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(onSubmit).toHaveBeenCalledWith('모여');
  });

  it('요청 중에는 완료를 다시 누를 수 없다', async () => {
    const user = userEvent.setup();
    renderDrawer({ currentNickname: '소미', isSubmitting: true });

    await user.type(await findInput(), '모여');

    expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeDisabled();
  });

  it('취소를 누르면 저장하지 않고 닫는다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();
    renderDrawer({ currentNickname: '소미', onOpenChange, onSubmit });

    await user.type(await findInput(), '모여');
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('닫혔다가 다시 열리면 입력하던 값이 아니라 지금 쓰는 닉네임으로 되돌아간다', async () => {
    const user = userEvent.setup();
    const { rerender } = renderDrawer({ currentNickname: '소미' });

    await user.type(await findInput(), '모여');
    rerender(
      <EditMeetingNicknameDrawer
        currentNickname="소미"
        open={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    rerender(
      <EditMeetingNicknameDrawer
        currentNickname="소미"
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(await findInput()).toHaveValue('소미');
  });
});
