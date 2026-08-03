import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './spinner';

describe('Spinner', () => {
  it('기본 로딩 상태를 접근 가능한 이름으로 제공한다', () => {
    render(<Spinner />);

    expect(screen.getByRole('status', { name: '불러오는 중' })).toBeInTheDocument();
  });

  it('사용처에 맞는 라벨과 크기를 적용한다', () => {
    render(<Spinner size="sm" label="모임 정보를 불러오는 중" data-testid="spinner" />);

    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveAccessibleName('모임 정보를 불러오는 중');
    expect(spinner.firstElementChild).toHaveClass('size-5', 'border-2');
  });

  it('회전 링은 스크린 리더에서 숨긴다', () => {
    render(<Spinner />);

    expect(screen.getByRole('status').firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
