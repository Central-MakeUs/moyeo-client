import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Badge } from './badge';

describe('Badge', () => {
  it('children을 그대로 렌더한다', () => {
    render(<Badge>모임장</Badge>);

    expect(screen.getByText('모임장')).toBeInTheDocument();
  });

  it('tone을 지정하지 않으면 neutral로 렌더한다', () => {
    render(<Badge>응답 대기중</Badge>);

    expect(screen.getByText('응답 대기중')).toHaveAttribute('data-tone', 'neutral');
  });

  it('tone="primary"면 해당 톤으로 렌더한다', () => {
    render(<Badge tone="primary">모임장</Badge>);

    expect(screen.getByText('모임장')).toHaveAttribute('data-tone', 'primary');
  });
});
