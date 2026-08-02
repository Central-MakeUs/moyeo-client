import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CoordinationSection } from './coordination-section';

vi.mock('./schedule-candidates-section', () => ({
  ScheduleCandidatesSection: () => <div>일정조율스텁</div>,
}));
vi.mock('./place-recommendations-section', () => ({
  PlaceRecommendationsSection: () => <div>위치조율스텁</div>,
}));

describe('CoordinationSection', () => {
  it('SCHEDULE_AND_PLACE면 탭이 표시되고, 기본값은 "일정 조율 현황"이며 "위치 조율 현황"을 누르면 전환된다', async () => {
    const user = userEvent.setup();
    render(<CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_AND_PLACE" />);

    expect(screen.getByRole('tab', { name: '일정 조율 현황' })).toBeInTheDocument();
    expect(screen.getByText('일정조율스텁')).toBeInTheDocument();
    expect(screen.queryByText('위치조율스텁')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '위치 조율 현황' }));

    expect(screen.getByText('위치조율스텁')).toBeInTheDocument();
    expect(screen.queryByText('일정조율스텁')).not.toBeInTheDocument();
  });

  it('SCHEDULE_ONLY면 탭 없이 일정 조율 목록만 표시된다', () => {
    render(<CoordinationSection inviteCode="29NRVBGXGP" planningType="SCHEDULE_ONLY" />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('일정조율스텁')).toBeInTheDocument();
    expect(screen.queryByText('위치조율스텁')).not.toBeInTheDocument();
  });

  it('PLACE_ONLY면 탭 없이 위치 조율 목록만 표시된다', () => {
    render(<CoordinationSection inviteCode="29NRVBGXGP" planningType="PLACE_ONLY" />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('위치조율스텁')).toBeInTheDocument();
    expect(screen.queryByText('일정조율스텁')).not.toBeInTheDocument();
  });
});
