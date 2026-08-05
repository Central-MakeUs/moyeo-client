import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditResponseButton } from './edit-response-button';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('EditResponseButton', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('"내 응답 수정하기" 라벨의 버튼을 렌더한다', () => {
    render(<EditResponseButton inviteCode="29NRVBGXGP" target="schedule" />);

    expect(screen.getByRole('button', { name: '내 응답 수정하기' })).toBeInTheDocument();
  });

  it('일정 탭에서는 일정 수정 화면으로 보낸다', async () => {
    const user = userEvent.setup();
    render(<EditResponseButton inviteCode="29NRVBGXGP" target="schedule" />);

    await user.click(screen.getByRole('button', { name: '내 응답 수정하기' }));

    expect(push).toHaveBeenCalledWith('/meetings/edit/schedule?code=29NRVBGXGP');
  });

  it('위치 탭에서는 출발지 수정 화면으로 보낸다', async () => {
    const user = userEvent.setup();
    render(<EditResponseButton inviteCode="29NRVBGXGP" target="departure" />);

    await user.click(screen.getByRole('button', { name: '내 응답 수정하기' }));

    expect(push).toHaveBeenCalledWith('/meetings/edit/departure?code=29NRVBGXGP');
  });
});
