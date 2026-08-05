import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useParticipationDraft } from './participation-draft';
import { useSubmitParticipation } from './use-submit-participation';

const { joinGuest, joinMember, replace, writeGuestSession } = vi.hoisted(() => ({
  joinGuest: vi.fn(),
  joinMember: vi.fn(),
  replace: vi.fn(),
  writeGuestSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  joinGuest,
  joinMember,
}));

vi.mock('@/entities/guest-session', () => ({ writeGuestSession }));

const GUEST_IDENTITY = {
  kind: 'guest',
  inviteToken: 'ABC123',
  nickname: '소미',
  password: '1234',
} as const;

const MEMBER_IDENTITY = { kind: 'member', inviteToken: 'ABC123', nickname: '소미' } as const;

const COMPLETE_SCHEDULE = { availableDates: ['2026-08-15'] };

beforeEach(() => {
  joinGuest.mockReset();
  joinMember.mockReset();
  replace.mockReset();
  writeGuestSession.mockReset();
  useParticipationDraft.setState({
    identity: GUEST_IDENTITY,
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
});

function renderSubmit(planningType: 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE') {
  return renderHook(() => useSubmitParticipation({ inviteCode: 'ABC123', planningType }));
}

describe('useSubmitParticipation', () => {
  it('PLACE_ONLY 초안이 불완전하면 참여 요청을 보내지 않는다', async () => {
    const { result } = renderSubmit('PLACE_ONLY');

    await act(() => result.current.submit());

    expect(joinGuest).not.toHaveBeenCalled();
    expect(joinMember).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('신원이 없으면 참여 요청을 보내지 않는다', async () => {
    useParticipationDraft.setState({ identity: null, scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(joinGuest).not.toHaveBeenCalled();
    expect(joinMember).not.toHaveBeenCalled();
  });

  it('게스트 신원이면 게스트 참여로 보내고 게스트 세션에 닉네임을 남긴다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(joinGuest).toHaveBeenCalledTimes(1);
    expect(joinMember).not.toHaveBeenCalled();
    expect(writeGuestSession).toHaveBeenCalledWith('ABC123', '소미');
    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');
  });

  it('회원 신원이면 회원 참여로 보내고 게스트 세션은 남기지 않는다', async () => {
    useParticipationDraft.setState({
      identity: MEMBER_IDENTITY,
      scheduleResponse: COMPLETE_SCHEDULE,
    });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(joinMember).toHaveBeenCalledTimes(1);
    expect(joinGuest).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');
  });

  it('제출에 실패하면 완료 화면으로 보내지 않는다', async () => {
    joinGuest.mockRejectedValueOnce(new Error('network'));
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(replace).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
  });
});
