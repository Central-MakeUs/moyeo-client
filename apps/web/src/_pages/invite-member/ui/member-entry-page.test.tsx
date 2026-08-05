import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useParticipationDraft } from '@/features/meeting/invite-participation';
import type { SessionState } from '@/entities/session';

import { MemberEntryPage } from './member-entry-page';

const { push, session } = vi.hoisted(() => ({
  push: vi.fn(),
  // 기본 닉네임 채우기(#bb2d2a1)가 세션을 읽는다. 기본값은 비로그인 = 채울 값 없음.
  session: { current: { status: 'anonymous' } as SessionState },
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// `useSession`은 내부에서 `useQuery`를 쓴다. 실제 훅을 그대로 두면 QueryClientProvider가 없어
// 렌더가 터진다. 같은 모듈의 다른 export를 화면이 쓸 수 있으므로 부분 모킹한다
// (`_pages/invite/ui/invite-landing-page.test.tsx` 선례).
vi.mock('@/entities/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/session')>()),
  useSession: () => session.current,
}));

beforeEach(() => {
  push.mockReset();
  session.current = { status: 'anonymous' };
  useParticipationDraft.getState().reset();
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

    expect(useParticipationDraft.getState().identity).toEqual({
      kind: 'member',
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
