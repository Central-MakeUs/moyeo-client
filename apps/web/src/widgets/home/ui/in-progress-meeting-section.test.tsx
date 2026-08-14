import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import type { MeetingSummary } from '@/entities/meeting';

import { InProgressMeetingSection } from './in-progress-meeting-section';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function buildMeeting(overrides: Partial<MeetingSummary> = {}): MeetingSummary {
  return {
    meetingId: 1,
    inviteCode: '29NRVBGXGP',
    name: '데모데이에 모여',
    capacity: 5,
    joinedCount: 3,
    ...overrides,
  };
}

describe('InProgressMeetingSection', () => {
  it('inProgress에 모임 3개면 섹션 타이틀이 "진행 중 모임 3"이고 카드 3장, 점 3개가 렌더된다', async () => {
    const inProgress = [
      buildMeeting({ meetingId: 1 }),
      buildMeeting({ meetingId: 2 }),
      buildMeeting({ meetingId: 3 }),
    ];
    render(<InProgressMeetingSection inProgress={inProgress} />);

    // 라벨과 개수가 별도 span으로 나뉘어 있어 getByText로는 못 잡는다.
    expect(document.body).toHaveTextContent('진행 중 모임3');
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-slot="page-indicator-dot"]')).toHaveLength(3);
    });
  });

  it('inProgress에 모임 1개면 타이틀이 "진행 중 모임 1"이고 카드 1장, 활성 점 1개가 렌더된다', async () => {
    render(<InProgressMeetingSection inProgress={[buildMeeting({ meetingId: 1 })]} />);

    expect(document.body).toHaveTextContent('진행 중 모임1');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await waitFor(() => {
      const dots = document.querySelectorAll('[data-slot="page-indicator-dot"]');
      expect(dots).toHaveLength(1);
      expect(dots[0]).toHaveClass('w-5');
    });
  });

  it('inProgress가 빈 배열이면 타이틀이 "진행 중 모임 0"이고 Empty State 안내 문구가 표시되며 캐러셀·점은 렌더되지 않는다', () => {
    render(<InProgressMeetingSection inProgress={[]} />);

    expect(document.body).toHaveTextContent('진행 중 모임0');
    expect(screen.getByText('아직 모임이 없어요')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(document.querySelectorAll('[data-slot="page-indicator-dot"]')).toHaveLength(0);
  });
});
