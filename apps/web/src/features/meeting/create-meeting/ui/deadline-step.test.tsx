import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { DeadlineStep } from './deadline-step';

const NO_DEADLINE = '마감 기한 없이 여유롭게 답변받을래요';

describe('DeadlineStep', () => {
  beforeEach(() => {
    useCreateMeetingDraft.setState({ deadlineMinutes: null, noDeadline: false });
  });

  it("should set deadlineMinutes to 1440 when '1일' quick-select is clicked", async () => {
    render(<DeadlineStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '1일' }));

    expect(useCreateMeetingDraft.getState().deadlineMinutes).toBe(1440);
  });

  it("should enable the 다음 button when '1일' is selected", async () => {
    render(<DeadlineStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '1일' }));

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it(`should set noDeadline true when '${NO_DEADLINE}' is clicked`, async () => {
    render(<DeadlineStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: NO_DEADLINE }));

    expect(useCreateMeetingDraft.getState().noDeadline).toBe(true);
  });

  // 마감 기한 없이는 토글이 아니라 CRT-06으로 즉시 이동하는 동작이다(crt-04.md F03).
  it(`should call onNext once when '${NO_DEADLINE}' is clicked`, async () => {
    const onNext = vi.fn();
    render(<DeadlineStep onNext={onNext} />);

    await userEvent.click(screen.getByRole('button', { name: NO_DEADLINE }));

    expect(onNext).toHaveBeenCalledOnce();
  });

  it(`should discard the selected deadline when '${NO_DEADLINE}' is clicked`, async () => {
    render(<DeadlineStep onNext={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '1일' }));

    await userEvent.click(screen.getByRole('button', { name: NO_DEADLINE }));

    expect(useCreateMeetingDraft.getState().deadlineMinutes).toBeNull();
  });

  // CRT-06에서 뒤로 돌아오면 마감 미선택 초기 화면이어야 한다(crt-04.md F03).
  it("should keep the '1일' quick-select enabled when re-entered with noDeadline true", () => {
    useCreateMeetingDraft.setState({ noDeadline: true, deadlineMinutes: null });
    render(<DeadlineStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '1일' })).toBeEnabled();
  });

  it('should keep the 다음 button disabled when nothing is selected (deadlineMinutes null, noDeadline false)', () => {
    render(<DeadlineStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });
});
