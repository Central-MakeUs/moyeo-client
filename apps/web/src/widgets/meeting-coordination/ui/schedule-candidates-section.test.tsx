import { describe, it, expect, vi } from 'vitest';
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

describe('ScheduleCandidatesSection', () => {
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
