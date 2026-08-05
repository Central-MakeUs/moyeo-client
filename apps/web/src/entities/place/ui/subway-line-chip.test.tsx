import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SubwayLineChip } from './subway-line-chip';
import { SUBWAY_LINE_COLORS } from '../model/subway-line-colors';

describe('SubwayLineChip', () => {
  it('숫자 노선이면 숫자만 표시하고 해당 노선 색을 배경으로 쓴다', () => {
    render(<SubwayLineChip lineName="2호선" />);

    const chip = screen.getByText('2');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveStyle({ backgroundColor: SUBWAY_LINE_COLORS['2호선'] });
  });

  it('이름 노선이면 전체 이름을 표시한다', () => {
    render(<SubwayLineChip lineName="경의중앙선" />);

    expect(screen.getByText('경의중앙선')).toBeInTheDocument();
  });
});
