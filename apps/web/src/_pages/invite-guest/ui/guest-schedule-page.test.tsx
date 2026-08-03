import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGuestJoinDraft } from '@/features/meeting/invite-participation';

import { GuestSchedulePage } from './guest-schedule-page';

const { push, replace, joinGuest } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  joinGuest: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  joinGuest,
}));

const IDENTITY = { inviteToken: 'ABC123', nickname: '소미', password: '1234' };
const CANDIDATE_DATES = ['2026-08-15', '2026-08-20'];

/** 후보 날짜가 전부 미래라 지난 날짜 비활성화가 끼어들지 않는 기준일. */
const SERVER_TODAY = '2026-08-01';

const renderPage = (candidateDates: string[] = CANDIDATE_DATES, serverToday = SERVER_TODAY) =>
  render(
    <GuestSchedulePage
      inviteToken="ABC123"
      planningType="SCHEDULE_ONLY"
      candidateDates={candidateDates}
      serverToday={serverToday}
    />
  );

/**
 * 후보 날짜 셀을 날짜 숫자로 찾는다. '2026-08-15' → '1'
 *
 * react-day-picker 셀은 접근성 이름이 아니라 텍스트로 찾는다(기존 캘린더 테스트와 같은 방식).
 */
const dateCell = (isoDate: string) => screen.getByText(String(Number(isoDate.slice(-2))));

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  joinGuest.mockReset();
  joinGuest.mockResolvedValue({});
  useGuestJoinDraft.setState({ identity: IDENTITY, scheduleResponse: null });
});

describe('GuestSchedulePage', () => {
  it('후보 날짜가 두 개면 두 날짜가 선택 가능한 상태로 보인다', () => {
    renderPage();

    expect(dateCell('2026-08-15')).toBeEnabled();
    expect(dateCell('2026-08-20')).toBeEnabled();
  });

  // 모임장이 만든 링크를 며칠 뒤에 여는 게 정상이라 후보 날짜가 이미 지나 있을 수 있다.
  it('후보 날짜라도 서버 기준 오늘보다 이전이면 고를 수 없다', () => {
    renderPage(CANDIDATE_DATES, '2026-08-20');

    expect(dateCell('2026-08-15')).toBeDisabled();
    expect(dateCell('2026-08-20')).toBeEnabled();
  });

  it('아무 날짜도 고르지 않으면 참여 버튼이 disabled다', () => {
    renderPage();

    expect(screen.getByRole('button', { name: '참여하기' })).toBeDisabled();
  });

  it('스토어에 후보 밖 날짜가 남아 있으면 렌더 직후 비워진다', () => {
    useGuestJoinDraft.setState({
      identity: IDENTITY,
      scheduleResponse: { availableDates: ['2026-08-25'] },
    });

    renderPage();

    expect(useGuestJoinDraft.getState().scheduleResponse?.availableDates).toEqual([]);
  });

  it('날짜를 고르고 참여하기를 탭하면 게스트 참여 요청이 한 번 나간다', async () => {
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(joinGuest).toHaveBeenCalledTimes(1);
    expect(joinGuest).toHaveBeenCalledWith('ABC123', {
      nickname: '소미',
      password: '1234',
      scheduleResponse: { availableDates: ['2026-08-15'] },
    });
  });

  it('제출이 성공하면 참여 완료 화면으로 이동한다', async () => {
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');
    expect(useGuestJoinDraft.getState()).toMatchObject({
      identity: null,
      scheduleResponse: null,
    });
  });

  it('제출 중에 참여하기를 두 번 더 탭해도 요청은 한 번만 나간다', async () => {
    let resolveJoin: (value: unknown) => void = () => {};
    joinGuest.mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = resolve;
      })
    );
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    const submit = screen.getByRole('button', { name: '참여하기' });
    await userEvent.click(submit);
    await userEvent.click(submit);
    await userEvent.click(submit);

    expect(joinGuest).toHaveBeenCalledTimes(1);
    resolveJoin({});
  });

  it('제출이 실패하면 고른 날짜가 유지되고 참여 버튼이 다시 활성이다', async () => {
    joinGuest.mockRejectedValue(new Error('500'));
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(replace).not.toHaveBeenCalled();
    expect(useGuestJoinDraft.getState().scheduleResponse?.availableDates).toEqual(['2026-08-15']);
    expect(screen.getByRole('button', { name: '참여하기' })).toBeEnabled();
  });

  it('초안이 다른 모임 것이면 게스트 신원 화면으로 돌려보낸다', () => {
    useGuestJoinDraft.setState({
      identity: { ...IDENTITY, inviteToken: 'OLD123' },
      scheduleResponse: null,
    });

    renderPage();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });

  it('초안이 없으면 게스트 신원 화면으로 돌려보낸다', () => {
    useGuestJoinDraft.setState({ identity: null, scheduleResponse: null });

    renderPage();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });
});
