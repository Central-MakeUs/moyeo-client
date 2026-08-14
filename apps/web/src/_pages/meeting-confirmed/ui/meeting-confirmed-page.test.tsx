import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingConfirmedPage } from './meeting-confirmed-page';

const { useMeetingDetailQueryMock, push, replace } = vi.hoisted(() => ({
  useMeetingDetailQueryMock: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@/entities/meeting', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/meeting')>();
  return { ...actual, useMeetingDetailQuery: useMeetingDetailQueryMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams('code=ABC123'),
}));

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  useMeetingDetailQueryMock.mockReturnValue({
    data: { name: '데모데이에 모여', isConfirmed: true, confirmedPlaceName: '부산역' },
    isLoading: false,
    isFetching: false,
    isError: false,
  });
});

describe('MeetingConfirmedPage', () => {
  it('확정된 모임 확인하기를 탭하면 현황 화면으로 이동한다', async () => {
    render(<MeetingConfirmedPage />);

    await userEvent.click(screen.getByRole('button', { name: '확정된 모임 확인하기' }));

    expect(push).toHaveBeenCalledWith('/meetings?code=ABC123');
  });

  // 상세를 모달로 겹쳐 띄우던 화면이다. 이동으로 바꿨으니 겹쳐 뜨는 것이 없어야 한다.
  it('확정된 모임 확인하기를 탭해도 모달이 열리지 않는다', async () => {
    render(<MeetingConfirmedPage />);

    await userEvent.click(screen.getByRole('button', { name: '확정된 모임 확인하기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('홈으로 가기를 탭하면 홈으로 바꾼다', async () => {
    render(<MeetingConfirmedPage />);

    await userEvent.click(screen.getByRole('button', { name: '홈으로 가기' }));

    // push가 아니라 replace다. 완료 화면이라 뒤로가기로 되돌아오면 안 된다.
    expect(replace).toHaveBeenCalledWith('/home');
  });
});
