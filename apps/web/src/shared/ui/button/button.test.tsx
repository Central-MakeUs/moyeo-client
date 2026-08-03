import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('버튼이 로딩 중이면 비활성화하고 처리 중 상태를 알린다', () => {
    render(<Button isLoading>참여하기</Button>);

    const button = screen.getByRole('button', { name: '참여하기' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it.each([
    ['default', 'border-t-white'],
    ['outline', 'border-t-accessible-500'],
    ['ghost', 'border-t-neutral-600'],
    ['link', 'border-t-neutral-500'],
  ] as const)('%s variant에 맞는 로딩 Spinner 색상을 적용한다', (variant, spinnerClass) => {
    render(
      <Button variant={variant} isLoading>
        저장하기
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-loading', 'true');
    expect(button.querySelector('[data-slot="spinner"]')?.className).toContain(spinnerClass);
  });

  it('로딩 중에도 기존 버튼 이름과 너비를 위한 문구를 유지한다', () => {
    render(<Button isLoading>저장하기</Button>);

    expect(screen.getByText('저장하기')).toHaveClass('invisible');
    expect(screen.getByRole('button')).toHaveAccessibleName('저장하기');
  });

  it('로딩 Spinner는 스크린 리더에서 숨긴다', () => {
    render(<Button isLoading>저장하기</Button>);

    expect(screen.getByRole('button').querySelector('[data-slot="spinner"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('기존 disabled와 로딩 상태를 함께 존중한다', () => {
    const { rerender } = render(<Button disabled>저장하기</Button>);
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(<Button isLoading>저장하기</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
