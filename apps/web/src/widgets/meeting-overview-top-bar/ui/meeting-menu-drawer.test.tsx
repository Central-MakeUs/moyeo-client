import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingMenuDrawer, type MeetingMenuItem } from './meeting-menu-drawer';

type Role = 'host' | 'member' | 'guest';

function renderMenu(role: Role, onSelect: (item: MeetingMenuItem) => void = vi.fn()) {
  return render(<MeetingMenuDrawer role={role} open onOpenChange={vi.fn()} onSelect={onSelect} />);
}

/** 메뉴에 보이는 버튼 문구를 순서대로 모은다. */
function menuLabels(): string[] {
  return screen
    .getAllByRole('button')
    .map((button) => button.textContent?.trim() ?? '')
    .filter((label) => label.length > 0);
}

describe('MeetingMenuDrawer', () => {
  it('모임장에게 링크 복사·닉네임 수정·모임 삭제를 보여준다', async () => {
    renderMenu('host');

    expect(await screen.findByRole('button', { name: '링크 복사하기' })).toBeInTheDocument();
    expect(menuLabels()).toEqual(['링크 복사하기', '닉네임 수정하기', '모임 삭제']);
  });

  it('로그인 참여자에게는 삭제 대신 나가기를 보여준다', async () => {
    renderMenu('member');

    await screen.findByRole('button', { name: '링크 복사하기' });
    expect(menuLabels()).toEqual(['링크 복사하기', '닉네임 수정하기', '모임 나가기']);
  });

  it('게스트에게는 닉네임 수정을 감춘다', async () => {
    renderMenu('guest');

    await screen.findByRole('button', { name: '링크 복사하기' });
    expect(menuLabels()).toEqual(['링크 복사하기', '모임 나가기']);
    expect(screen.queryByRole('button', { name: '닉네임 수정하기' })).not.toBeInTheDocument();
  });

  it('항목을 누르면 어떤 항목인지 알린다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu('host', onSelect);

    await user.click(await screen.findByRole('button', { name: '모임 삭제' }));

    expect(onSelect).toHaveBeenCalledWith('delete-meeting');
  });
});
