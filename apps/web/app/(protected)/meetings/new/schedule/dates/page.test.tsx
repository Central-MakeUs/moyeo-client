import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';
import type { CreateMeetingDraftState } from '@/features/meeting/create-meeting/model/create-meeting-draft';

import CreateMeetingScheduleDatesPage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

const { useServerToday } = vi.hoisted(() => ({ useServerToday: vi.fn() }));
vi.mock('@/features/meeting/create-meeting/model/use-server-today', () => ({ useServerToday }));

/** schedule-dates 스텝 가드를 통과하는 최소 draft. */
const completedDraft: Partial<CreateMeetingDraftState> = {
  name: '주말 등산',
  maxParticipants: 6,
  noDeadline: true,
  planningType: 'SCHEDULE_ONLY',
  scheduleCandidateDates: ['2026-07-10'],
};

describe('CreateMeetingScheduleDatesPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    push.mockClear();
    replace.mockClear();
    useServerToday.mockReturnValue({
      serverToday: '2026-07-10',
      status: 'success',
      refetch: vi.fn(),
    });
    useCreateMeetingDraft.setState({ ...completedDraft, scheduleInputType: 'DATE_AND_TIME' });
  });

  it("should call router.push('/meetings/new/schedule/times') when 다음 is clicked given DATE_AND_TIME", async () => {
    useCreateMeetingDraft.setState({
      ...completedDraft,
      scheduleInputType: 'DATE_AND_TIME',
      availableStartTime: '17:00',
      availableEndTime: '23:00',
    });
    render(<CreateMeetingScheduleDatesPage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/schedule/times');
  });

  it('should not call router.push when 다음 is clicked given DATE_ONLY (제출은 Issue 6)', async () => {
    useCreateMeetingDraft.setState({ ...completedDraft, scheduleInputType: 'DATE_ONLY' });
    render(<CreateMeetingScheduleDatesPage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).not.toHaveBeenCalled();
  });

  it("should replace to '/meetings/new/basic' and render nothing when preceding steps are incomplete", () => {
    useCreateMeetingDraft.setState({ ...completedDraft, name: '' });
    render(<CreateMeetingScheduleDatesPage />);

    // resolveEntryPath는 첫 미완성 스텝으로 보낸다. 여기선 name이 비어 basic이 미완성이다.
    expect(replace).toHaveBeenCalledWith('/meetings/new/basic');
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
  });
});
