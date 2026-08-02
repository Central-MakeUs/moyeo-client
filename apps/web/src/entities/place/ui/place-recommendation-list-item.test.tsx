import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PlaceRecommendationListItem } from './place-recommendation-list-item';

describe('PlaceRecommendationListItem', () => {
  it('상권명·구/동·평균 직선거리를 표시한다', () => {
    render(
      <PlaceRecommendationListItem
        areaName="합정동"
        guName="마포구"
        dongName="합정동"
        averageStraightDistanceMeters={820}
      />
    );

    expect(screen.getByText('합정동')).toBeInTheDocument();
    expect(screen.getByText('마포구 합정동')).toBeInTheDocument();
    expect(screen.getByText('평균 직선거리 820m')).toBeInTheDocument();
  });

  it('구/동이 없으면 지역 라벨을 렌더하지 않는다', () => {
    render(<PlaceRecommendationListItem areaName="랜덤 상권" />);

    expect(screen.getByText('랜덤 상권')).toBeInTheDocument();
    expect(screen.queryByText(/평균 직선거리/)).not.toBeInTheDocument();
  });
});
