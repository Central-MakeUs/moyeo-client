import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithQuery } from '@/shared/lib/render-with-query';

import { MeetingOverviewTopBar } from './meeting-overview-top-bar';

const INVITE_CODE = 'abc123';
/** 메뉴가 닫히길 기다렸다 다음 오버레이를 열므로, 기본 1s보다 넉넉히 준다. */
const SHEET_TIMEOUT = { timeout: 3000 };

const { useMeetingViewerRole } = vi.hoisted(() => ({ useMeetingViewerRole: vi.fn() }));
vi.mock('../model/use-meeting-viewer-role', () => ({ useMeetingViewerRole }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }));

vi.mock('@/entities/guest-session', () => ({
  useGuestSession: () => ({ nickname: null, isRestored: true }),
  clearGuestSession: vi.fn(),
}));

vi.mock('@/entities/session', () => ({
  useSession: () => ({
    status: 'authenticated',
    accessToken: 'token',
    viewer: { id: 10, nickname: '소미', onboardingCompleted: true },
  }),
}));

vi.mock('@/shared/api', () => ({
  useGetMeetingView: () => ({
    data: { meetingId: 7, participants: [{ participantId: 1, userId: 10, nickname: '소미' }] },
  }),
  getGetMeetingViewQueryKey: () => ['meeting-view'],
  getGetMyParticipationQueryKey: () => ['my-participation'],
  getGetMyMeetingsQueryKey: () => ['my-meetings'],
  updateMeetingParticipantNickname: vi.fn(),
  deleteMeeting: vi.fn(),
  leaveMeeting: vi.fn(),
  leaveGuest: vi.fn(),
}));

describe('MeetingOverviewTopBar', () => {
  beforeEach(() => {
    useMeetingViewerRole.mockReturnValue('host');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('메뉴에서 닉네임 수정하기를 고르면 메뉴가 닫히고 지금 닉네임이 채워진 Drawer가 뜬다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<MeetingOverviewTopBar inviteCode={INVITE_CODE} />);

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await user.click(await screen.findByRole('button', { name: '닉네임 수정하기' }));

    expect(await screen.findByText('모임별 닉네임 수정', {}, SHEET_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByLabelText('모임별 닉네임')).toHaveValue('소미');
    expect(screen.queryByRole('button', { name: '닉네임 수정하기' })).not.toBeInTheDocument();
  });

  it('모임장이 모임 삭제를 고르면 삭제 확인 팝업이 뜬다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<MeetingOverviewTopBar inviteCode={INVITE_CODE} />);

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await user.click(await screen.findByRole('button', { name: '모임 삭제' }));

    expect(await screen.findByText('모임을 삭제할까요?', {}, SHEET_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('모든 참여자에게서 삭제되고 되돌릴 수 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('참여자가 모임 나가기를 고르면 나가기 확인 팝업이 뜬다', async () => {
    useMeetingViewerRole.mockReturnValue('member');
    const user = userEvent.setup();
    renderWithQuery(<MeetingOverviewTopBar inviteCode={INVITE_CODE} />);

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await user.click(await screen.findByRole('button', { name: '모임 나가기' }));

    expect(await screen.findByText('모임을 나갈까요?', {}, SHEET_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByText('내가 입력한 기록이 모두 사라져요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '나가기' })).toBeInTheDocument();
  });

  it('참여자가 아니면 더보기 버튼을 감춘다', () => {
    useMeetingViewerRole.mockReturnValue('non-participant');
    renderWithQuery(<MeetingOverviewTopBar inviteCode={INVITE_CODE} />);

    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument();
  });
});
