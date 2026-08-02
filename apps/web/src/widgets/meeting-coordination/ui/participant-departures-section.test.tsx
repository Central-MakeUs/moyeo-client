import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ParticipantDeparturesSection } from './participant-departures-section';

const { usePlaceViewQueryMock } = vi.hoisted(() => ({
  usePlaceViewQueryMock: vi.fn(),
}));

vi.mock('@/entities/place', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/place')>();
  return { ...actual, usePlaceViewQuery: usePlaceViewQueryMock };
});

describe('ParticipantDeparturesSection', () => {
  it('참여 인원/정원과 참여자별 출발 위치를 표시한다', () => {
    usePlaceViewQueryMock.mockReturnValue({
      data: {
        participantCount: 3,
        recommendations: [],
        participants: [
          { participantId: 1, nickname: '소미', isHost: true, departureName: '회사' },
          { participantId: 2, nickname: '린', isHost: false, departureName: '합정역 2번 출구' },
          { participantId: 3, nickname: '제이', isHost: false, departureName: '신촌역 2번 출구' },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<ParticipantDeparturesSection inviteCode="29NRVBGXGP" capacity={4} />);

    expect(document.body).toHaveTextContent('참여자 출발 위치3/4');
    expect(screen.getByText('소미')).toBeInTheDocument();
    expect(screen.getByText('린')).toBeInTheDocument();
    expect(screen.getByText('제이')).toBeInTheDocument();
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
