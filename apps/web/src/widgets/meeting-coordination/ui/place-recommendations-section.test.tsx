import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PlaceRecommendationsSection } from './place-recommendations-section';

const { usePlaceViewQueryMock } = vi.hoisted(() => ({
  usePlaceViewQueryMock: vi.fn(),
}));

vi.mock('@/entities/place', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/place')>();
  return { ...actual, usePlaceViewQuery: usePlaceViewQueryMock };
});

describe('PlaceRecommendationsSection', () => {
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
});
