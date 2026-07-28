import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';
import type { CreateMeetingDraftState } from '@/features/meeting/create-meeting/model/create-meeting-draft';

import CreateMeetingScheduleTimesPage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

const { useServerToday } = vi.hoisted(() => ({ useServerToday: vi.fn() }));
vi.mock('@/features/meeting/create-meeting/model/use-server-today', () => ({ useServerToday }));

/** schedule-times 스텝 가드를 통과하는 최소 draft. */
const completedDraft: Partial<CreateMeetingDraftState> = {
  name: '주말 등산',
  maxParticipants: 6,
  noDeadline: true,
  planningType: 'SCHEDULE_ONLY',
  scheduleInputType: 'DATE_AND_TIME',
  availableStartTime: '18:00',
  availableEndTime: '21:00',
  scheduleCandidateDates: ['2026-07-10'],
};

describe('CreateMeetingScheduleTimesPage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    useServerToday.mockReturnValue({
      serverToday: '2026-07-01',
      status: 'success',
      refetch: vi.fn(),
    });
    useCreateMeetingDraft.setState(completedDraft);
  });

  it('should render the grid when preceding steps are complete', () => {
    const { container } = render(<CreateMeetingScheduleTimesPage />);

    expect(container.querySelectorAll('[data-cell-key]')).toHaveLength(3);
  });

  it('앞 스텝이 미완성이면 첫 미완성 스텝으로 replace하고 아무것도 렌더하지 않는다', () => {
    useCreateMeetingDraft.setState({ ...completedDraft, scheduleCandidateDates: [] });
    render(<CreateMeetingScheduleTimesPage />);

    // resolveEntryPath는 첫 미완성 스텝으로 보낸다. 여기선 후보 날짜가 비어 schedule-dates가 미완성이다.
    expect(replace).toHaveBeenCalledWith('/meetings/new/schedule/dates');
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
  });

  it("planningType이 'SCHEDULE_AND_PLACE'일 때 다음을 탭하면 '/meetings/new/departure'로 이동한다", async () => {
    useCreateMeetingDraft.setState({
      ...completedDraft,
      planningType: 'SCHEDULE_AND_PLACE',
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-07-10', startTime: '18:00', endTime: '19:00' },
        ],
      },
    });
    render(<CreateMeetingScheduleTimesPage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/departure');
  });
});
