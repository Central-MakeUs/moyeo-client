import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import CreateMeetingCreatedPage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

/** created 스텝 가드를 통과하는 최소 draft(basic·type·time-range·deadline 완성). */
const completedDraft = {
  name: '주말 등산',
  maxParticipants: 6,
  noDeadline: true,
  deadlineMinutes: null,
};

describe('CreateMeetingCreatedPage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    useCreateMeetingDraft.setState({
      ...completedDraft,
      planningType: null,
      scheduleInputType: null,
    });
  });

  it("should push '/meetings/new/schedule/dates' when '내 정보 입력하기' is clicked given SCHEDULE_ONLY and DATE_AND_TIME", async () => {
    useCreateMeetingDraft.setState({
      ...completedDraft,
      planningType: 'SCHEDULE_ONLY',
      scheduleInputType: 'DATE_AND_TIME',
      availableStartTime: '17:00',
      availableEndTime: '23:00',
    });
    render(<CreateMeetingCreatedPage />);

    await userEvent.click(screen.getByRole('button', { name: '내 정보 입력하기' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/schedule/dates');
  });

  it("should push '/meetings/new/schedule/dates' when '내 정보 입력하기' is clicked given SCHEDULE_ONLY and DATE_ONLY", async () => {
    useCreateMeetingDraft.setState({
      ...completedDraft,
      planningType: 'SCHEDULE_ONLY',
      scheduleInputType: 'DATE_ONLY',
    });
    render(<CreateMeetingCreatedPage />);

    await userEvent.click(screen.getByRole('button', { name: '내 정보 입력하기' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/schedule/dates');
  });

  it("should push '/meetings/new/departure' when '내 정보 입력하기' is clicked given PLACE_ONLY", async () => {
    useCreateMeetingDraft.setState({ ...completedDraft, planningType: 'PLACE_ONLY' });
    render(<CreateMeetingCreatedPage />);

    await userEvent.click(screen.getByRole('button', { name: '내 정보 입력하기' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/departure');
  });

  it('should replace to the first unfilled step and render nothing when preceding steps are incomplete', () => {
    useCreateMeetingDraft.setState({ name: '', planningType: 'SCHEDULE_ONLY' });
    render(<CreateMeetingCreatedPage />);

    expect(replace).toHaveBeenCalledWith('/meetings/new/basic');
    expect(screen.queryByText('모임을 만들었어요!')).not.toBeInTheDocument();
  });
});
