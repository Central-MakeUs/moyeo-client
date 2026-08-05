import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { HomePage } from './home-page';

const { useMeetingsQueryMock } = vi.hoisted(() => ({ useMeetingsQueryMock: vi.fn() }));

vi.mock('@/entities/meeting', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/meeting')>();
  return { ...actual, useMeetingsQuery: useMeetingsQueryMock };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('HomePage', () => {
  it('useMeetingsQuery가 진행 중 2개/확정 1개를 반환하도록 mock되면 상단바, "진행 중 모임 2" 섹션, "확정된 모임 1" 섹션이 순서대로 렌더된다', () => {
    useMeetingsQueryMock.mockReturnValue({
      data: {
        inProgress: [
          { meetingId: 1, name: '데모데이에 모여', capacity: 5, joinedCount: 3 },
          { meetingId: 2, name: 'CMC 회식', capacity: 5, joinedCount: 3 },
        ],
        confirmed: [
          {
            meetingId: 3,
            name: 'UT데이',
            capacity: 5,
            joinedCount: 3,
            confirmedScheduleDate: '2026-07-18',
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<HomePage />);

    expect(screen.getByRole('img', { name: 'MOYEO' })).toBeInTheDocument();
    // 라벨과 개수가 별도 span으로 나뉘어 있어 getByText로는 못 잡는다.
    expect(document.body).toHaveTextContent('진행 중 모임2');
    expect(document.body).toHaveTextContent('확정된 모임1');
  });

  it('useMeetingsQuery가 isLoading: true를 반환하도록 mock되면 로딩 안내 텍스트가 표시된다', () => {
    useMeetingsQueryMock.mockReturnValue({
      data: { inProgress: [], confirmed: [] },
      isLoading: true,
      isError: false,
    });

    render(<HomePage />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('useMeetingsQuery가 isError: true를 반환하도록 mock되면 에러 안내 텍스트가 표시된다', () => {
    useMeetingsQueryMock.mockReturnValue({
      data: { inProgress: [], confirmed: [] },
      isLoading: false,
      isError: true,
    });

    render(<HomePage />);

    expect(screen.getByText('모임 목록을 불러오지 못했어요')).toBeInTheDocument();
  });
});
