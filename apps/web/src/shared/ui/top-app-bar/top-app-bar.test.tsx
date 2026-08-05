import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TopAppBar } from './top-app-bar';

describe('TopAppBar', () => {
  it('title과 leading, trailing action을 렌더링한다', () => {
    render(
      <TopAppBar
        title="모임 만들기"
        leading={<button type="button">뒤로가기</button>}
        trailing={<button type="button">닫기</button>}
      />
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('모임 만들기')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('주입한 action callback을 실행한다', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <TopAppBar
        title="모임 만들기"
        leading={
          <button type="button" onClick={onBack}>
            뒤로가기
          </button>
        }
      />
    );

    await user.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('className과 기본 header DOM props를 전달한다', () => {
    render(
      <TopAppBar
        title="모임 만들기"
        className="sticky"
        aria-label="화면 상단"
        data-testid="top-app-bar"
      />
    );

    expect(screen.getByTestId('top-app-bar')).toHaveClass('sticky');
    expect(screen.getByRole('banner', { name: '화면 상단' })).toBeInTheDocument();
  });
});
