import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useParticipationDraft } from '@/features/meeting/invite-participation';
import { renderWithQuery } from '@/shared/lib/render-with-query';

import { SchedulePage } from './schedule-page';

const { push, replace, joinGuest, joinMember, writeGuestSession } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  joinGuest: vi.fn(),
  joinMember: vi.fn(),
  writeGuestSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  joinGuest,
  joinMember,
}));

vi.mock('@/entities/guest-session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/guest-session')>()),
  writeGuestSession,
}));

const IDENTITY = {
  kind: 'guest',
  inviteToken: 'ABC123',
  nickname: '소미',
  password: '1234',
} as const;
const CANDIDATE_DATES = ['2026-08-15', '2026-08-20'];

/** 후보 날짜가 전부 미래라 지난 날짜 비활성화가 끼어들지 않는 기준일. */
const SERVER_TODAY = '2026-08-01';

const renderPage = (candidateDates: string[] = CANDIDATE_DATES, serverToday = SERVER_TODAY) =>
  renderWithQuery(
    <SchedulePage
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
  joinMember.mockReset();
  joinMember.mockResolvedValue({});
  writeGuestSession.mockReset();
  useParticipationDraft.setState({
    identity: IDENTITY,
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
});

describe('SchedulePage', () => {
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

  // 표시 월을 제어 prop으로 넘기면서 onMonthChange를 빼면 < > 를 눌러도 월이 멈춘다.
  it('후보 첫 날짜의 달로 열리고 다음 달 버튼으로 월을 넘길 수 있다', async () => {
    renderPage();

    expect(screen.getByText('2026년 8월')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('2026년 9월')).toBeInTheDocument();
  });

  it('아무 날짜도 고르지 않으면 참여 버튼이 disabled다', () => {
    renderPage();

    expect(screen.getByRole('button', { name: '참여하기' })).toBeDisabled();
  });

  it('스토어에 후보 밖 날짜가 남아 있으면 렌더 직후 비워진다', () => {
    useParticipationDraft.setState({
      identity: IDENTITY,
      scheduleResponse: { availableDates: ['2026-08-25'] },
    });

    renderPage();

    expect(useParticipationDraft.getState().scheduleResponse?.availableDates).toEqual([]);
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

  it('회원 초안이면 일정 선택을 회원 초안에 저장한다', async () => {
    useParticipationDraft.getState().reset();
    useParticipationDraft.setState({
      identity: { kind: 'member', inviteToken: 'ABC123', nickname: '소미' },
      scheduleResponse: null,
    });
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));

    expect(useParticipationDraft.getState().scheduleResponse).toEqual({
      availableDates: ['2026-08-15'],
    });
  });

  it('일정만 조율하는 회원은 joinMember를 호출하고 참여 완료 화면으로 이동한다', async () => {
    useParticipationDraft.getState().reset();
    useParticipationDraft.setState({
      identity: { kind: 'member', inviteToken: 'ABC123', nickname: '소미' },
      scheduleResponse: null,
    });
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(joinMember).toHaveBeenCalledTimes(1);
    expect(joinMember).toHaveBeenCalledWith('ABC123', {
      nickname: '소미',
      scheduleResponse: { availableDates: ['2026-08-15'] },
    });
    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');
  });

  it('제출이 성공하면 초안을 유지한 채 참여 완료 화면으로 이동한다', async () => {
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(replace).toHaveBeenLastCalledWith('/i/ABC123/complete');
    expect(useParticipationDraft.getState()).toMatchObject({
      identity: IDENTITY,
      scheduleResponse: { availableDates: ['2026-08-15'] },
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

    expect(submit).toHaveAttribute('aria-busy', 'true');
    expect(submit).toBeDisabled();

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
    expect(useParticipationDraft.getState().scheduleResponse?.availableDates).toEqual([
      '2026-08-15',
    ]);
    expect(screen.getByRole('button', { name: '참여하기' })).toBeEnabled();
  });

  it('초안이 다른 모임 것이면 게스트 신원 화면으로 돌려보낸다', () => {
    useParticipationDraft.setState({
      identity: { ...IDENTITY, inviteToken: 'OLD123' },
      scheduleResponse: null,
    });

    renderPage();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });

  it('초안이 없으면 게스트 신원 화면으로 돌려보낸다', () => {
    useParticipationDraft.setState({ identity: null, scheduleResponse: null });

    renderPage();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });

  it("참여 제출이 성공하면 writeGuestSession이 'ABC123'·'소미'로 호출된다", async () => {
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(writeGuestSession).toHaveBeenCalledWith('ABC123', '소미');
  });

  // 서버가 참여를 받아주지 않았으니 게스트로 기록하면 안 된다.
  // 제출 시도 자체는 있었음을 joinGuest 호출로 함께 확인한다.
  it('참여 제출이 실패하면 writeGuestSession이 호출되지 않는다', async () => {
    joinGuest.mockRejectedValue(new Error('500'));
    renderPage();

    await userEvent.click(dateCell('2026-08-15'));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(joinGuest).toHaveBeenCalledTimes(1);
    expect(writeGuestSession).not.toHaveBeenCalled();
  });
});
