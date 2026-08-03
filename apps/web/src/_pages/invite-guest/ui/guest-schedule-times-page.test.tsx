import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGuestJoinDraft } from '@/features/meeting/invite-participation';

import { GuestScheduleTimesPage } from './guest-schedule-times-page';

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
const CANDIDATES = [
  {
    candidateDate: '2026-08-15',
    availableTimeRanges: [{ startTime: '10:00:00', endTime: '14:00:00' }],
  },
  {
    candidateDate: '2026-08-20',
    availableTimeRanges: [{ startTime: '10:00:00', endTime: '14:00:00' }],
  },
];

/** 후보 날짜가 전부 미래라 지난 날짜 비활성화가 끼어들지 않는 기준일. */
const SERVER_TODAY = '2026-08-01';

const renderPage = (candidates = CANDIDATES, serverToday = SERVER_TODAY) =>
  render(
    <GuestScheduleTimesPage
      inviteToken="ABC123"
      planningType="SCHEDULE_ONLY"
      candidates={candidates}
      serverToday={serverToday}
    />
  );

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  joinGuest.mockReset();
  joinGuest.mockResolvedValue({});
  useGuestJoinDraft.setState({ identity: IDENTITY, scheduleResponse: null });
});

describe('GuestScheduleTimesPage', () => {
  it('후보 날짜 열과 가능 시간 행으로 시간표가 보인다', () => {
    renderPage();

    expect(screen.getByText('8/15')).toBeInTheDocument();
    expect(screen.getByText('8/20')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('시간 칸을 고르고 참여하기를 탭하면 고른 시간대가 요청에 실린다', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: '8월 15일 10시' }));
    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(joinGuest).toHaveBeenCalledWith('ABC123', {
      nickname: '소미',
      password: '1234',
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-08-15', startTime: '10:00', endTime: '11:00' },
        ],
      },
    });
  });

  it('아무 칸도 고르지 않으면 참여하기 버튼이 disabled다', () => {
    renderPage();

    expect(screen.getByRole('button', { name: '참여하기' })).toBeDisabled();
  });

  it('가능 시간이 유효하지 않아 행이 없으면 참여하기 버튼이 disabled다', () => {
    renderPage([
      {
        candidateDate: '2026-08-15',
        availableTimeRanges: [{ startTime: '14:00:00', endTime: '10:00:00' }],
      },
    ]);

    expect(screen.getByRole('button', { name: '참여하기' })).toBeDisabled();
  });

  it('날짜별 선택 가능 범위 밖의 시간 칸은 비활성화한다', () => {
    renderPage([
      {
        candidateDate: '2026-08-15',
        availableTimeRanges: [{ startTime: '10:00:00', endTime: '12:00:00' }],
      },
      {
        candidateDate: '2026-08-20',
        availableTimeRanges: [{ startTime: '11:00:00', endTime: '14:00:00' }],
      },
    ]);

    expect(screen.getByRole('button', { name: '8월 15일 12시' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '8월 20일 10시' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '8월 15일 10시' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '8월 20일 11시' })).toBeEnabled();
  });

  // 모임장이 하루 안에서 떨어진 시간대만 열 수 있다. 사이 시간을 행에서 빼면 10·11·19시가
  // 붙어 보여 연속된 시간대로 오해한다.
  it('한 날짜에 떨어진 범위가 여러 개면 사이 시간 칸을 비활성화한 채로 남긴다', () => {
    renderPage([
      {
        candidateDate: '2026-08-15',
        availableTimeRanges: [
          { startTime: '10:00:00', endTime: '12:00:00' },
          { startTime: '19:00:00', endTime: '21:00:00' },
        ],
      },
    ]);

    expect(screen.getByRole('button', { name: '8월 15일 11시' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '8월 15일 15시' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '8월 15일 19시' })).toBeEnabled();
  });

  // 모임장이 만든 링크를 며칠 뒤에 여는 게 정상이라 후보 날짜가 이미 지나 있을 수 있다.
  it('서버 기준 오늘보다 이전인 날짜 열은 전부 비활성화한다', () => {
    renderPage(CANDIDATES, '2026-08-20');

    expect(screen.getByRole('button', { name: '8월 15일 10시' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '8월 15일 13시' })).toBeDisabled();
  });

  it('서버 기준 오늘 당일 열은 열어 둔다', () => {
    renderPage(CANDIDATES, '2026-08-20');

    expect(screen.getByRole('button', { name: '8월 20일 10시' })).toBeEnabled();
  });

  it('초안이 없으면 게스트 신원 화면으로 돌려보낸다', () => {
    useGuestJoinDraft.setState({ identity: null, scheduleResponse: null });

    renderPage();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });
});
