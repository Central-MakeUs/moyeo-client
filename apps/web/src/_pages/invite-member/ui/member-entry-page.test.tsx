import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMemberJoinDraft } from '@/features/meeting/invite-participation';

import { MemberEntryPage } from './member-entry-page';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockReset();
  useMemberJoinDraft.getState().reset();
});

describe('MemberEntryPage', () => {
  it('비밀번호 입력 없이 다음 CTA를 보여준다', () => {
    render(<MemberEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
    expect(screen.queryByLabelText('비밀번호')).not.toBeInTheDocument();
  });

  it('닉네임을 저장하고 일정 화면으로 이동한다', async () => {
    render(<MemberEntryPage inviteToken="ABC123" planningType="SCHEDULE_ONLY" />);

    await userEvent.type(screen.getByLabelText('내 닉네임'), '소미');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(useMemberJoinDraft.getState().identity).toEqual({
      inviteToken: 'ABC123',
      nickname: '소미',
    });
    expect(push).toHaveBeenCalledWith('/i/ABC123/respond/schedule');
  });

  it('장소만 조율하면 출발지 화면으로 이동한다', async () => {
    render(<MemberEntryPage inviteToken="ABC123" planningType="PLACE_ONLY" />);

    await userEvent.type(screen.getByLabelText('내 닉네임'), '소미');
    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/i/ABC123/respond/departure');
  });
});
