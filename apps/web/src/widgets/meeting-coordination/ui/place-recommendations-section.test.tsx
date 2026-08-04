import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlaceRecommendationsSection } from './place-recommendations-section';

const { usePlaceViewQueryMock } = vi.hoisted(() => ({
  usePlaceViewQueryMock: vi.fn(),
}));

vi.mock('@/entities/place', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/place')>();
  return { ...actual, usePlaceViewQuery: usePlaceViewQueryMock };
});

const { useMeetingHostMock } = vi.hoisted(() => ({ useMeetingHostMock: vi.fn() }));
vi.mock('../model/use-meeting-host', () => ({ useMeetingHost: useMeetingHostMock }));

// 확정 요청은 이 화면의 검증 대상이 아니다. meetingId 조회와 함께 실제 호출을 끊는다.
const { confirmMock } = vi.hoisted(() => ({ confirmMock: vi.fn() }));
vi.mock('@/features/meeting/confirm-place', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/meeting/confirm-place')>()),
  useConfirmPlace: () => ({ confirm: confirmMock, isConfirming: false }),
}));
const { meetingViewData } = vi.hoisted(() => ({
  meetingViewData: { current: { meetingId: 7 } as Record<string, unknown> },
}));
vi.mock('@/shared/api', () => ({ useGetMeetingView: () => ({ data: meetingViewData.current }) }));

describe('PlaceRecommendationsSection', () => {
  beforeEach(() => {
    meetingViewData.current = { meetingId: 7 };
    // 기본은 참여자 시점. 모임장만 후보를 고를 수 있다.
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: false });
  });

  it('이미 확정됐으면 모임장에게도 후보가 눌리지 않는다', () => {
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: true });
    usePlaceViewQueryMock.mockReturnValue({
      data: {
        participantCount: 5,
        recommendations: [{ rank: 1, areaCode: 'A01', areaName: '합정동' }],
        participants: [],
      },
      isLoading: false,
      isError: false,
    });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" isConfirmed />);

    expect(screen.queryByRole('button', { name: /합정동/ })).not.toBeInTheDocument();
  });

  it('추천 후보가 있으면 타이틀에 개수가 표시되고 목록이 렌더된다', () => {
    usePlaceViewQueryMock.mockReturnValue({
      data: {
        participantCount: 5,
        recommendations: [
          {
            rank: 1,
            areaName: '합정동',
            guName: '마포구',
            dongName: '합정동',
            averageTravelTimeSeconds: 720,
            station: { name: '합정역', lineNames: ['2호선', '6호선'] },
          },
          { rank: 2, areaName: '신촌동' },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" />);

    expect(document.body).toHaveTextContent('추천 위치 후보2');
    expect(screen.getByText('합정동')).toBeInTheDocument();
    expect(screen.getByText('신촌동')).toBeInTheDocument();
    expect(screen.getByText('평균 12분')).toBeInTheDocument();
    expect(screen.getByText('지하철 2·6호선')).toBeInTheDocument();
  });

  it('recommendations가 빈 배열이면 "추천 위치 후보가 없어요" 안내가 표시된다', () => {
    usePlaceViewQueryMock.mockReturnValue({
      data: { participantCount: 1, recommendations: [] },
      isLoading: false,
      isError: false,
    });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" />);

    expect(screen.getByText('추천 위치 후보가 없어요')).toBeInTheDocument();
  });

  it('isLoading이 true이면 로딩 안내가 표시된다', () => {
    usePlaceViewQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('isError가 true이면 에러 안내가 표시된다', () => {
    usePlaceViewQueryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" />);

    expect(screen.getByText('위치 정보를 불러오지 못했어요')).toBeInTheDocument();
  });

  it('모임장이 후보를 고르면 위치 확정 확인 팝업이 뜬다', async () => {
    const user = userEvent.setup();
    useMeetingHostMock.mockReturnValue({ participantId: 1, isViewerHost: true });
    usePlaceViewQueryMock.mockReturnValue({
      data: {
        participantCount: 5,
        recommendations: [{ rank: 1, areaCode: 'A01', areaName: '합정동' }],
        participants: [],
      },
      isLoading: false,
      isError: false,
    });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" />);
    await user.click(screen.getByText('합정동'));

    expect(await screen.findByText('모임 위치를 확정할까요?')).toBeInTheDocument();
    expect(screen.getByText('확정된 위치는 변경할 수 없어요')).toBeInTheDocument();
  });

  it('참여자에게는 후보가 눌리지 않는다', () => {
    usePlaceViewQueryMock.mockReturnValue({
      data: {
        participantCount: 5,
        recommendations: [{ rank: 1, areaCode: 'A01', areaName: '합정동' }],
        participants: [],
      },
      isLoading: false,
      isError: false,
    });

    render(<PlaceRecommendationsSection inviteCode="29NRVBGXGP" />);

    expect(screen.queryByRole('button', { name: /합정동/ })).not.toBeInTheDocument();
  });
});
