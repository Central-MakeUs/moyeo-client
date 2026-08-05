import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import MeetingInvitePage from './page';

const { replace, searchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));
vi.mock('@/entities/session', () => ({
  useSession: () => ({
    status: 'authenticated',
    accessToken: 'token',
    viewer: { id: 1, nickname: '모리', onboardingCompleted: true },
  }),
}));

/** next/script는 jsdom에서 실제 로드가 의미 없으므로 렌더만 되게 둔다. */
vi.mock('next/script', () => ({ default: () => null }));

beforeEach(() => {
  replace.mockClear();
  searchParams.set('code', '5UKSN9MC2M');
  useCreateMeetingDraft.setState({ name: '팀 회식', planningType: 'PLACE_ONLY' });
});

describe('MeetingInvitePage', () => {
  it('진입하면 생성 draft를 비운다', () => {
    render(<MeetingInvitePage />);

    // 제출 훅에서 비우면 위저드 가드가 홈으로 되돌린다. 플로우의 끝인 여기서 비운다.
    expect(useCreateMeetingDraft.getState().name).toBe('');
    expect(useCreateMeetingDraft.getState().planningType).toBeNull();
  });

  it('쿼리의 초대 코드로 공유 링크를 만들어 보여준다', async () => {
    render(<MeetingInvitePage />);

    expect(await screen.findByText(`${window.location.origin}/i/5UKSN9MC2M`)).toBeInTheDocument();
  });

  it('초대 코드가 없으면 안내 문구를 보이고 공유 버튼을 비활성화한다', async () => {
    searchParams.delete('code');
    render(<MeetingInvitePage />);

    expect(await screen.findByText('링크를 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'URL 복사' })).toBeDisabled();
  });

  it('홈으로 돌아가기를 탭하면 /home으로 바꾼다', async () => {
    render(<MeetingInvitePage />);

    await userEvent.click(await screen.findByRole('button', { name: '홈으로 돌아가기' }));

    expect(replace).toHaveBeenCalledWith('/home');
  });
});
