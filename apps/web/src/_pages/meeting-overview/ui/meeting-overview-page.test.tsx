import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingOverviewPage } from './meeting-overview-page';

const { useMeetingDetailQueryMock, routerBackMock } = vi.hoisted(() => ({
  useMeetingDetailQueryMock: vi.fn(),
  routerBackMock: vi.fn(),
}));

vi.mock('@/entities/meeting', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/meeting')>();
  return { ...actual, useMeetingDetailQuery: useMeetingDetailQueryMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: routerBackMock }),
  useSearchParams: () => new URLSearchParams('code=29NRVBGXGP'),
}));

describe('MeetingOverviewPage', () => {
  it('설명이 있는 모임을 반환하면 모임명·설명·참여 정원이 모두 표시된다', () => {
    useMeetingDetailQueryMock.mockReturnValue({
      data: {
        name: '데모데이에 모여',
        description: '부산 BEXCO에서 열리는 데모데이',
        capacity: 5,
        joinedCount: 3,
      },
      isLoading: false,
      isError: false,
    });

    render(<MeetingOverviewPage />);

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이')).toBeInTheDocument();
    expect(document.body).toHaveTextContent('3/5');
  });

  it('description이 undefined이면 설명 문단을 렌더하지 않는다', () => {
    useMeetingDetailQueryMock.mockReturnValue({
      data: { name: '설명 없는 모임', description: undefined, capacity: 5, joinedCount: 0 },
      isLoading: false,
      isError: false,
    });

    render(<MeetingOverviewPage />);

    expect(screen.getByText('설명 없는 모임')).toBeInTheDocument();
    expect(screen.queryByText('부산 BEXCO에서 열리는 데모데이')).not.toBeInTheDocument();
  });

  it('isLoading이 true이면 로딩 안내 텍스트가 표시된다', () => {
    useMeetingDetailQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    render(<MeetingOverviewPage />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('isError가 true이면 에러 안내 텍스트가 표시된다', () => {
    useMeetingDetailQueryMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<MeetingOverviewPage />);

    expect(screen.getByText('모임 정보를 불러오지 못했어요')).toBeInTheDocument();
  });

  it('뒤로가기 버튼을 누르면 router.back()이 호출된다', async () => {
    const user = userEvent.setup();
    useMeetingDetailQueryMock.mockReturnValue({
      data: { name: '데모데이에 모여', description: undefined, capacity: 5, joinedCount: 3 },
      isLoading: false,
      isError: false,
    });

    render(<MeetingOverviewPage />);
    await user.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(routerBackMock).toHaveBeenCalledOnce();
  });
});
