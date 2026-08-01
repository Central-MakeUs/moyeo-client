import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HomeTopBar } from './home-top-bar';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('HomeTopBar', () => {
  it('렌더하면 "MOYEO" alt 텍스트를 가진 로고 이미지가 표시된다', () => {
    render(<HomeTopBar />);

    expect(screen.getByRole('img', { name: 'MOYEO' })).toBeInTheDocument();
  });

  it("프로필 버튼을 클릭하면 router.push가 '/mypage'로 호출된다", async () => {
    push.mockClear();
    render(<HomeTopBar />);

    await userEvent.click(screen.getByRole('button', { name: '프로필 열기' }));

    expect(push).toHaveBeenCalledWith('/mypage');
  });
});
