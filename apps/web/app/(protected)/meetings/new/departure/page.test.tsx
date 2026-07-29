import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';
import type { CreateMeetingDraftState } from '@/features/meeting/create-meeting/model/create-meeting-draft';

import CreateMeetingDeparturePage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

/** departure 스텝 가드를 통과하는 최소 draft (PLACE_ONLY 흐름). */
const completedDraft: Partial<CreateMeetingDraftState> = {
  name: '주말 등산',
  maxParticipants: 6,
  noDeadline: true,
  planningType: 'PLACE_ONLY',
  departure: null,
  transportationMode: null,
};

describe('CreateMeetingDeparturePage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    useCreateMeetingDraft.setState(completedDraft);
  });

  it('PLACE_ONLY draft로 진입하면 출발지 화면이 보인다', () => {
    render(<CreateMeetingDeparturePage />);

    expect(screen.getByRole('radio', { name: '대중교통' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("출발지 필드를 탭하면 '/meetings/new/departure/search'로 이동한다", async () => {
    render(<CreateMeetingDeparturePage />);

    await userEvent.click(screen.getByRole('button', { name: /출발지/ }));

    expect(push).toHaveBeenCalledWith('/meetings/new/departure/search');
  });

  it('SCHEDULE_ONLY draft로 직접 진입하면 가드가 resolver로 되돌린다', () => {
    useCreateMeetingDraft.setState({ ...completedDraft, planningType: 'SCHEDULE_ONLY' });
    render(<CreateMeetingDeparturePage />);

    // SCHEDULE_ONLY 흐름에는 departure 스텝이 없다 → 진입 불가.
    expect(replace).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
  });
});
