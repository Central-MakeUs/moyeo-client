import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PlaceRecommendationListItem } from './place-recommendation-list-item';

describe('PlaceRecommendationListItem', () => {
  it('상권명·구/동을 표시한다', () => {
    render(<PlaceRecommendationListItem areaName="합정동" guName="마포구" dongName="합정동" />);

    expect(screen.getByText('합정동')).toBeInTheDocument();
    expect(screen.getByText('마포구 합정동')).toBeInTheDocument();
  });

  it('구/동이 없으면 지역 라벨을 렌더하지 않는다', () => {
    render(<PlaceRecommendationListItem areaName="랜덤 상권" />);

    expect(screen.getByText('랜덤 상권')).toBeInTheDocument();
    expect(screen.queryByText('마포구 합정동')).not.toBeInTheDocument();
  });
});
