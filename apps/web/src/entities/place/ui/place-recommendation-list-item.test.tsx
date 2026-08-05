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

  it('averageTravelTimeSeconds가 있으면 "평균 N분"을 표시한다', () => {
    render(<PlaceRecommendationListItem areaName="합정동" averageTravelTimeSeconds={720} />);

    expect(screen.getByText('평균 12분')).toBeInTheDocument();
  });

  it('averageTravelTimeSeconds가 없으면 이동시간을 표시하지 않는다', () => {
    render(<PlaceRecommendationListItem areaName="합정동" />);

    expect(screen.queryByText(/평균/)).not.toBeInTheDocument();
  });

  it('station이 있으면 구/동 대신 노선과 노선 칩을 표시한다', () => {
    render(
      <PlaceRecommendationListItem
        areaName="합정동"
        guName="마포구"
        dongName="합정동"
        station={{ name: '합정역', lineNames: ['2호선', '6호선'] }}
      />
    );

    expect(screen.getByText('지하철 2·6호선')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.queryByText('마포구 합정동')).not.toBeInTheDocument();
    expect(screen.queryByText(/합정역/)).not.toBeInTheDocument();
  });

  it('station이 없으면(그냥 장소) 지하철 정보를 표시하지 않는다', () => {
    render(<PlaceRecommendationListItem areaName="랜덤 장소" />);

    expect(screen.queryByText(/^지하철/)).not.toBeInTheDocument();
  });
});
