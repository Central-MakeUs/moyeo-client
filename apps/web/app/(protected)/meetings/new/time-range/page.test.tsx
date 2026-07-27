import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import CreateMeetingTimeRangePage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

describe('CreateMeetingTimeRangePage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    useCreateMeetingDraft.setState({
      name: '주말 등산',
      maxParticipants: 6,
      planningType: 'SCHEDULE_ONLY',
      scheduleInputType: null,
      availableStartTime: null,
      availableEndTime: null,
    });
  });

  it("should push '/meetings/new/deadline' when 다음 is clicked with a valid time range", async () => {
    useCreateMeetingDraft.setState({
      scheduleInputType: 'DATE_AND_TIME',
      availableStartTime: '09:00',
      availableEndTime: '18:00',
    });
    render(<CreateMeetingTimeRangePage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/deadline');
  });

  it("should replace '/meetings/new' when planningType is null (guard)", () => {
    useCreateMeetingDraft.setState({ planningType: null });
    render(<CreateMeetingTimeRangePage />);

    expect(replace).toHaveBeenCalledWith('/meetings/new');
  });
});
