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

const { useMeetingHostMock, useViewerIdentityMock, useIsViewerParticipantMock } = vi.hoisted(
  () => ({
    useMeetingHostMock: vi.fn(),
    useViewerIdentityMock: vi.fn(),
    useIsViewerParticipantMock: vi.fn(),
  })
);
vi.mock('../model/use-meeting-host', () => ({ useMeetingHost: useMeetingHostMock }));
vi.mock('../model/use-viewer-identity', () => ({ useViewerIdentity: useViewerIdentityMock }));
vi.mock('../model/use-viewer-participation', () => ({
  useIsViewerParticipant: useIsViewerParticipantMock,
}));

// 확정 요청은 이 화면의 검증 대상이 아니다. meetingId 조회와 함께 실제 호출을 끊는다.
const { confirmMock } = vi.hoisted(() => ({ confirmMock: vi.fn() }));
vi.mock('@/features/meeting/confirm-schedule', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/meeting/confirm-schedule')>()),
  useConfirmSchedule: () => ({ confirm: confirmMock, isConfirming: false }),
}));
const { meetingViewData } = vi.hoisted(() => ({
  meetingViewData: { current: { meetingId: 7 } as Record<string, unknown> },
}));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  useGetMeetingView: () => ({ data: meetingViewData.current }),
}));

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

// 응답 수정 버튼이 라우터로 수정 화면에 보낸다. 이동 자체는 이 화면의 검증 대상이 아니다.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('ScheduleCandidatesSection', () => {
  beforeEach(() => {
    meetingViewData.current = { meetingId: 7 };
    useViewerIdentityMock.mockReturnValue({ userId: null, guestNickname: null });
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: false });
    // 기본은 참여자 시점. 응답 수정 버튼은 참여자에게만 보인다.
    useIsViewerParticipantMock.mockReturnValue(true);
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

  it('이미 확정됐으면 모임장에게도 일정 확정하기를 보여주지 않는다', async () => {
    const user = userEvent.setup();
    mockScheduleView();
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: true });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" isConfirmed />);
    await user.click(screen.getByText('7.18'));

    await screen.findByText('7월 18일 토요일');
    expect(screen.queryByRole('button', { name: '일정 확정하기' })).not.toBeInTheDocument();
  });

  it('모임장이 일정 확정하기를 누르면 상세가 닫히고 확인 팝업이 뜬다', async () => {
    const user = userEvent.setup();
    mockScheduleView();
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: true });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);
    await user.click(screen.getByText('7.18'));
    await user.click(await screen.findByRole('button', { name: '일정 확정하기' }));

    expect(await screen.findByText('모임 일정을 확정할까요?')).toBeInTheDocument();
    expect(screen.getByText('확정된 일정은 변경할 수 없어요')).toBeInTheDocument();
    // 상세는 닫힌다 — 시안에서 둘이 겹쳐 보이지 않는다.
    expect(screen.queryByText('7월 18일 토요일')).not.toBeInTheDocument();
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

  it('일정이 확정되면 응답 수정 버튼이 비활성화된다', () => {
    mockScheduleView();

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" isConfirmed />);

    expect(screen.getByRole('button', { name: '내 응답 수정하기' })).toBeDisabled();
  });

  it('참여하지 않은 사람에게는 응답 수정 버튼을 보여주지 않는다 — 고칠 응답이 없다', () => {
    useIsViewerParticipantMock.mockReturnValue(false);
    useScheduleViewQueryMock.mockReturnValue({
      data: { participantCount: 2, candidates: [CANDIDATE] },
      isLoading: false,
      isError: false,
    });

    render(<ScheduleCandidatesSection inviteCode="29NRVBGXGP" />);

    expect(screen.queryByRole('button', { name: '내 응답 수정하기' })).not.toBeInTheDocument();
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
