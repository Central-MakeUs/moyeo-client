import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CoordinationSection } from './coordination-section';

vi.mock('./schedule-candidates-section', () => ({
  ScheduleCandidatesSection: () => <div>일정조율스텁</div>,
}));
vi.mock('./place-recommendations-section', () => ({
  PlaceRecommendationsSection: () => <div>위치조율스텁</div>,
}));
vi.mock('./participant-departures-section', () => ({
  ParticipantDeparturesSection: () => <div>참여자출발위치스텁</div>,
}));

// 확정 여부와 확정된 값은 모임 현황 조회에서 온다.
const { meetingViewData } = vi.hoisted(() => ({
  meetingViewData: { current: {} as Record<string, unknown> },
}));
vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  useGetMeetingView: () => ({ data: meetingViewData.current }),
}));

// 응답 수정 버튼이 라우터로 수정 화면에 보낸다. 이동 자체는 이 화면의 검증 대상이 아니다.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('CoordinationSection', () => {
  beforeEach(() => {
    meetingViewData.current = {};
  });

  it('일정이 확정되면 일정 탭에 확정 카드를 보여준다', () => {
    meetingViewData.current = {
      confirmedScheduleDate: '2026-07-18',
      confirmedStartTime: '14:00:00',
      confirmedEndTime: '18:00:00',
    };

    render(
      <CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_AND_PLACE" capacity={4} />
    );

    expect(screen.getByText('일정이 확정되었어요!')).toBeInTheDocument();
    expect(screen.getByText('7/18 (토) 14:00~18:00')).toBeInTheDocument();
  });

  it('위치가 확정되면 위치 탭에 확정 카드를 보여준다', async () => {
    const user = userEvent.setup();
    meetingViewData.current = { confirmedPlaceName: '합정역' };

    render(
      <CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_AND_PLACE" capacity={4} />
    );
    await user.click(screen.getByRole('tab', { name: '위치 조율 현황' }));

    expect(screen.getByText('위치가 확정되었어요!')).toBeInTheDocument();
    expect(screen.getByText('합정역')).toBeInTheDocument();
  });

  it('확정 전에는 확정 카드가 없다', () => {
    render(
      <CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_AND_PLACE" capacity={4} />
    );

    expect(screen.queryByText('일정이 확정되었어요!')).not.toBeInTheDocument();
  });

  it('SCHEDULE_AND_PLACE면 탭이 표시되고, 기본값은 "일정 조율 현황"이며 "위치 조율 현황"을 누르면 전환된다', async () => {
    const user = userEvent.setup();
    render(
      <CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_AND_PLACE" capacity={4} />
    );

    expect(screen.getByRole('tab', { name: '일정 조율 현황' })).toBeInTheDocument();
    expect(screen.getByText('일정조율스텁')).toBeInTheDocument();
    expect(screen.queryByText('위치조율스텁')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '위치 조율 현황' }));

    expect(screen.getByText('위치조율스텁')).toBeInTheDocument();
    expect(screen.getByText('참여자출발위치스텁')).toBeInTheDocument();
    expect(screen.queryByText('일정조율스텁')).not.toBeInTheDocument();
  });

  it('SCHEDULE_ONLY면 탭 없이 일정 조율 목록만 표시된다', () => {
    render(
      <CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_ONLY" capacity={4} />
    );

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('일정조율스텁')).toBeInTheDocument();
    expect(screen.queryByText('위치조율스텁')).not.toBeInTheDocument();
  });

  it('PLACE_ONLY면 탭 없이 위치 조율 후보·참여자 출발 위치 목록을 표시한다', () => {
    render(<CoordinationSection inviteCode="29NRVBGXGP" planningType="PLACE_ONLY" capacity={4} />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('위치조율스텁')).toBeInTheDocument();
    expect(screen.getByText('참여자출발위치스텁')).toBeInTheDocument();
    expect(screen.queryByText('일정조율스텁')).not.toBeInTheDocument();
  });
});
