import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ScheduleCandidatesSection } from './schedule-candidates-section';

const { useScheduleViewQueryMock } = vi.hoisted(() => ({
  useScheduleViewQueryMock: vi.fn(),
}));

vi.mock('@/entities/schedule', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/schedule')>();
  return { ...actual, useScheduleViewQuery: useScheduleViewQueryMock };
});

const { useMeetingHostMock, useViewerIdentityMock } = vi.hoisted(() => ({
  useMeetingHostMock: vi.fn(),
  useViewerIdentityMock: vi.fn(),
}));
vi.mock('../model/use-meeting-host', () => ({ useMeetingHost: useMeetingHostMock }));
vi.mock('../model/use-viewer-identity', () => ({ useViewerIdentity: useViewerIdentityMock }));

/** 소미(모임장)·린이 가능한 후보 하나. */
const CANDIDATE = {
  candidateDate: '2026-07-18',
  startTime: '14:00:00',
  endTime: '18:00:00',
  availableParticipantCount: 2,
  availableParticipants: [
    { participantId: 1, userId: 10, nickname: '소미' },
    { participantId: 2, userId: 20, nickname: '린' },
  ],
};

function mockScheduleView() {
  useScheduleViewQueryMock.mockReturnValue({
    data: { participantCount: 7, candidates: [CANDIDATE] },
    isLoading: false,
    isError: false,
  });
}

describe('ScheduleCandidatesSection', () => {
  beforeEach(() => {
    useViewerIdentityMock.mockReturnValue({ userId: null, guestNickname: null });
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: false });
  });

  it('후보를 누르면 참여 가능자 목록 dialog가 열린다', async () => {
    const user = userEvent.setup();
    mockScheduleView();

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);
    await user.click(screen.getByText('7.18'));

    expect(await screen.findByText('7월 18일 토요일')).toBeInTheDocument();
    expect(screen.getByText('14:00~18:00 (4시간)')).toBeInTheDocument();
    expect(screen.getByText('린')).toBeInTheDocument();
    // 모임장은 현황 응답의 participantId와 대조해 찾는다.
    expect(screen.getByText('모임장')).toBeInTheDocument();
  });

  it('모임장으로 보면 dialog에 일정 확정하기 버튼이 있다', async () => {
    const user = userEvent.setup();
    mockScheduleView();
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: true });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);
    await user.click(screen.getByText('7.18'));

    expect(await screen.findByRole('button', { name: '일정 확정하기' })).toBeInTheDocument();
  });

  it('참여자로 보면 dialog에 일정 확정하기 버튼이 없다', async () => {
    const user = userEvent.setup();
    mockScheduleView();
    useViewerIdentityMock.mockReturnValue({ userId: 20, guestNickname: null });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);
    await user.click(screen.getByText('7.18'));

    await screen.findByText('7월 18일 토요일');
    expect(screen.queryByRole('button', { name: '일정 확정하기' })).not.toBeInTheDocument();
    // 본인 줄에는 (나)가 붙는다.
    expect(screen.getByText('린').parentElement).toHaveTextContent('린(나)');
  });

  it('후보가 있으면 타이틀에 개수가 표시되고 후보 목록이 렌더된다', () => {
    useScheduleViewQueryMock.mockReturnValue({
      data: {
        participantCount: 7,
        candidates: [
          {
            candidateDate: '2026-07-18',
            startTime: '10:00:00',
            endTime: '18:00:00',
            availableParticipantCount: 3,
            availableParticipants: [],
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);

    expect(document.body).toHaveTextContent('최적 일정 후보1');
    expect(screen.getByText('7.18')).toBeInTheDocument();
  });

  it('candidates가 빈 배열이면 "겹치는 일정이 없어요" 안내와 응답 수정 버튼이 표시된다', () => {
    useScheduleViewQueryMock.mockReturnValue({
      data: { participantCount: 2, candidates: [] },
      isLoading: false,
      isError: false,
    });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);

    expect(screen.getByText('겹치는 일정이 없어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 응답 수정하기' })).toBeInTheDocument();
  });

  it('isLoading이 true이면 로딩 안내가 표시된다', () => {
    useScheduleViewQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('isError가 true이면 에러 안내가 표시된다', () => {
    useScheduleViewQueryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);

    expect(screen.getByText('일정 정보를 불러오지 못했어요')).toBeInTheDocument();
  });

  it('기본 정렬은 "빠른 일자 순"이고, "길게 만나는 순"을 누르면 해당 sort로 훅을 다시 호출한다', async () => {
    const user = userEvent.setup();
    useScheduleViewQueryMock.mockReturnValue({
      data: { participantCount: 2, candidates: [] },
      isLoading: false,
      isError: false,
    });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);

    expect(useScheduleViewQueryMock).toHaveBeenCalledWith('29NRVBGXGP', 'EARLIEST_DATE');

    await user.click(screen.getByText('길게 만나는 순'));

    expect(useScheduleViewQueryMock).toHaveBeenCalledWith('29NRVBGXGP', 'LONGEST_MEETING');
  });
});
