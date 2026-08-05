import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ParticipantDeparturesSection } from './participant-departures-section';

const { usePlaceViewQueryMock } = vi.hoisted(() => ({
  usePlaceViewQueryMock: vi.fn(),
}));

vi.mock('@/entities/place', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/place')>();
  return { ...actual, usePlaceViewQuery: usePlaceViewQueryMock };
});

const { useViewerIdentityMock } = vi.hoisted(() => ({ useViewerIdentityMock: vi.fn() }));
vi.mock('../model/use-viewer-identity', () => ({ useViewerIdentity: useViewerIdentityMock }));

/** 소미(회원)·린(회원)·제이(게스트)가 참여 중인 모임. */
const PARTICIPANTS = [
  { participantId: 1, userId: 10, nickname: '소미', isHost: true, departureName: '회사' },
  {
    participantId: 2,
    userId: 20,
    nickname: '린',
    isHost: false,
    departureName: '합정역 2번 출구',
  },
  {
    participantId: 3,
    userId: null,
    nickname: '제이',
    isHost: false,
    departureName: '신촌역 2번 출구',
  },
];

function mockPlaceView() {
  usePlaceViewQueryMock.mockReturnValue({
    data: { participantCount: 3, recommendations: [], participants: PARTICIPANTS },
    isLoading: false,
    isError: false,
  });
}

describe('ParticipantDeparturesSection', () => {
  beforeEach(() => {
    useViewerIdentityMock.mockReturnValue({ userId: null, guestNickname: null });
  });

  it('참여 인원/정원과 참여자별 출발 위치를 표시한다', () => {
    mockPlaceView();

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(document.body).toHaveTextContent('참여자 출발 위치3/4');
    expect(screen.getByText('소미')).toBeInTheDocument();
    expect(screen.getByText('린')).toBeInTheDocument();
    expect(screen.getByText('제이')).toBeInTheDocument();
  });

  it('로그인 사용자의 줄에만 "(나)"를 붙인다', () => {
    mockPlaceView();
    useViewerIdentityMock.mockReturnValue({ userId: 20, guestNickname: null });

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(screen.getByText('린').parentElement).toHaveTextContent('린(나)');
    expect(screen.getAllByText('(나)')).toHaveLength(1);
  });

  it('게스트의 줄에도 "(나)"를 붙인다', () => {
    mockPlaceView();
    useViewerIdentityMock.mockReturnValue({ userId: null, guestNickname: '제이' });

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(screen.getByText('제이').parentElement).toHaveTextContent('제이(나)');
    expect(screen.getAllByText('(나)')).toHaveLength(1);
  });

  it('참여자가 아닌 사람에게는 아무 줄에도 "(나)"가 없다', () => {
    mockPlaceView();

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(screen.queryByText('(나)')).not.toBeInTheDocument();
  });

  it('isLoading이 true이면 로딩 안내가 표시된다', () => {
    usePlaceViewQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('isError가 true이면 에러 안내가 표시된다', () => {
    usePlaceViewQueryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(screen.getByText('위치 정보를 불러오지 못했어요')).toBeInTheDocument();
  });
});
