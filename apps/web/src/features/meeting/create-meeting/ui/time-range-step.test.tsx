import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { toast } from '@/shared/ui';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { TimeRangeStep } from './time-range-step';

describe('TimeRangeStep', () => {
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
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);

    useCreateMeetingDraft.setState({
      scheduleInputType: null,
      availableStartTime: null,
      availableEndTime: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set start '09:00' end '18:00' and scheduleInputType DATE_AND_TIME when '하루종일' is clicked", async () => {
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '하루종일' }));

    const state = useCreateMeetingDraft.getState();
    expect(state.scheduleInputType).toBe('DATE_AND_TIME');
    expect(state.availableStartTime).toBe('09:00');
    expect(state.availableEndTime).toBe('18:00');
  });

  it("should enable the 다음 button when '하루종일' is selected", async () => {
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '하루종일' }));

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it("should set scheduleInputType DATE_ONLY when '날짜만 정하고 싶어요' is clicked", async () => {
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '날짜만 정하고 싶어요' }));

    expect(useCreateMeetingDraft.getState().scheduleInputType).toBe('DATE_ONLY');
  });

  it("should disable the '하루종일' quick-select when '날짜만 정하고 싶어요' is selected", async () => {
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '날짜만 정하고 싶어요' }));

    expect(screen.getByRole('button', { name: '하루종일' })).toBeDisabled();
  });

  it('should keep the 다음 button disabled when nothing is selected (scheduleInputType null)', () => {
    render(<TimeRangeStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('should show a toast and keep the start time unchanged when start is not earlier than end', async () => {
    const toastSpy = vi.spyOn(toast, 'add');
    useCreateMeetingDraft.setState({ availableEndTime: '09:00' });
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /시작 시간/ }));
    await userEvent.click(screen.getByRole('button', { name: '선택' }));

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '시작 시간은 종료 시간보다 빨라야 해요',
      })
    );
    expect(useCreateMeetingDraft.getState().availableStartTime).toBeNull();
  });

  it('should show a toast and keep the end time unchanged when end is not later than start', async () => {
    const toastSpy = vi.spyOn(toast, 'add');
    useCreateMeetingDraft.setState({ availableStartTime: '18:00' });
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /종료 시간/ }));
    await userEvent.click(screen.getByRole('button', { name: '선택' }));

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '시작 시간은 종료 시간보다 빨라야 해요',
      })
    );
    expect(useCreateMeetingDraft.getState().availableEndTime).toBeNull();
  });
});
