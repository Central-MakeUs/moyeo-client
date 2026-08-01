import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { MeetingSummary } from '@/entities/meeting';

import { ConfirmedMeetingSection } from './confirmed-meeting-section';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function buildMeeting(overrides: Partial<MeetingSummary> = {}): MeetingSummary {
  return {
    meetingId: 1,
    name: 'CMC UT데이 (모여조)',
    capacity: 5,
    joinedCount: 3,
    confirmedScheduleDate: '2026-07-18',
    confirmedStartTime: '14:00',
    confirmedPlaceName: '공덕역',
    ...overrides,
  };
}

describe('ConfirmedMeetingSection', () => {
  it('confirmed에 모임 1개면 타이틀이 "확정된 모임 1"이고 카드 1개가 세로로 표시된다', () => {
    render(<ConfirmedMeetingSection confirmed={[buildMeeting()]} />);

    // 라벨과 개수가 별도 span으로 나뉘어 있어 getByText로는 못 잡는다.
    expect(document.body).toHaveTextContent('확정된 모임1');
    expect(screen.getByText('CMC UT데이 (모여조)')).toBeInTheDocument();
  });

  it('confirmed가 빈 배열이면 타이틀이 "확정된 모임 0"이고 Empty State 안내 문구가 표시된다', () => {
    render(<ConfirmedMeetingSection confirmed={[]} />);

    expect(document.body).toHaveTextContent('확정된 모임0');
    expect(screen.getByText('아직 모임이 없어요')).toBeInTheDocument();
  });
});
