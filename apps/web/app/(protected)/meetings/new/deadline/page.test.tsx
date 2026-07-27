import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import CreateMeetingDeadlinePage from './page';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

describe('CreateMeetingDeadlinePage', () => {
  beforeEach(() => {
    push.mockClear();
    // 위치 계열: deadline 선행 스텝(basic·type)만 충족하면 진입 가능.
    useCreateMeetingDraft.setState({
      name: '주말 등산',
      maxParticipants: 6,
      planningType: 'PLACE_ONLY',
      deadlineMinutes: null,
      noDeadline: false,
    });
  });

  // TODO(cover): cover 재삽입 시 deadline 다음 목적지는 다시 '/meetings/new/cover'가 된다.
  it("should push '/meetings/new/created' when 다음 is clicked with a valid deadline (cover deferred)", async () => {
    useCreateMeetingDraft.setState({ deadlineMinutes: 1440 });
    render(<CreateMeetingDeadlinePage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/created');
  });
});
