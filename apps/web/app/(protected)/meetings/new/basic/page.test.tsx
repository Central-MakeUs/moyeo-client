import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import CreateMeetingBasicPage from './page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

/** 기본 정보 필수값(이름·인원)을 채운 draft. */
function fillBasic() {
  useCreateMeetingDraft.setState({ name: '주말 등산', maxParticipants: 6 });
}

describe('CreateMeetingBasicPage', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    useCreateMeetingDraft.getState().reset();
  });

  it("should call router.push('/meetings/new/time-range') when 다음 is clicked with planningType 'SCHEDULE_ONLY'", async () => {
    const user = userEvent.setup();
    useCreateMeetingDraft.setState({ planningType: 'SCHEDULE_ONLY' });
    fillBasic();
    render(<CreateMeetingBasicPage />);

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/time-range');
  });

  // 🚧 마감 기한 스텝 임시 비활성화 — 재활성화 시 목적지가 다시 '/meetings/new/deadline'이 된다.
  it("should call router.push('/meetings/new/created') when 다음 is clicked with planningType 'PLACE_ONLY'", async () => {
    const user = userEvent.setup();
    useCreateMeetingDraft.setState({ planningType: 'PLACE_ONLY' });
    fillBasic();
    render(<CreateMeetingBasicPage />);

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/created');
  });

  // 유형이 없으면 흐름 자체가 없다. resolver를 한 번 거치지 않고 곧장 HOME으로 나간다.
  it("should call router.replace('/home') when planningType is null", () => {
    render(<CreateMeetingBasicPage />);

    expect(replace).toHaveBeenCalledWith('/home');
  });
});
