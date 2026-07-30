import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageControl } from './page-control';

/**
 * 시안(page-control.svg) 기준 스타일 계약:
 * - 활성   = 20×6 알약, `#FD716C`            → w-5  h-1.5 bg-accessible-400
 * - 비활성 = 6×6 원,   `#9B9B9B` opacity .3 → w-1.5 h-1.5 bg-neutral-300/30
 * 색/크기를 직접 단언해, 토큰을 잘못 옮기면 테스트가 잡도록 한다.
 */
const ACTIVE_STYLE = ['w-5', 'bg-accessible-400'];
const INACTIVE_STYLE = ['w-1.5', 'bg-neutral-300/30'];

function renderDots(props: { total: number; current: number }) {
  const { container } = render(<PageControl {...props} />);

  return Array.from(container.querySelectorAll('[data-slot="page-control-dot"]'));
}

describe('PageControl', () => {
  it('should render dots equal to total count when total=3', () => {
    expect(renderDots({ total: 3, current: 0 })).toHaveLength(3);
  });

  it('should style only the dot at current as an active pill when total=3, current=1', () => {
    const dots = renderDots({ total: 3, current: 1 });

    expect(dots[1]).toHaveClass(...ACTIVE_STYLE);
    expect(dots[0]).toHaveClass(...INACTIVE_STYLE);
    expect(dots[2]).toHaveClass(...INACTIVE_STYLE);
  });

  it('should render exactly one active dot when total=1, current=0', () => {
    const dots = renderDots({ total: 1, current: 0 });

    expect(dots).toHaveLength(1);
    expect(dots[0]).toHaveClass(...ACTIVE_STYLE);
  });

  it('should render no dots when total=0', () => {
    expect(renderDots({ total: 0, current: 0 })).toHaveLength(0);
  });
});
