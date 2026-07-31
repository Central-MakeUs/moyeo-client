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

  it("should set start '09:00' end '23:00' and scheduleInputType DATE_AND_TIME when '하루종일' is clicked", async () => {
    render(<TimeRangeStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '하루종일' }));

    const state = useCreateMeetingDraft.getState();
    expect(state.scheduleInputType).toBe('DATE_AND_TIME');
    expect(state.availableStartTime).toBe('09:00');
    expect(state.availableEndTime).toBe('23:00');
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

  // 날짜만 정하기는 토글이 아니라 CRT-04로 즉시 이동하는 동작이다(crt-03.md F03).
  it("should call onNext once when '날짜만 정하고 싶어요' is clicked", async () => {
    const onNext = vi.fn();
    render(<TimeRangeStep onNext={onNext} />);

    await userEvent.click(screen.getByRole('button', { name: '날짜만 정하고 싶어요' }));

    expect(onNext).toHaveBeenCalledOnce();
  });

  it("should discard the entered time range when '날짜만 정하고 싶어요' is clicked", async () => {
    render(<TimeRangeStep onNext={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: '하루종일' }));

    await userEvent.click(screen.getByRole('button', { name: '날짜만 정하고 싶어요' }));

    const state = useCreateMeetingDraft.getState();
    expect(state.availableStartTime).toBeNull();
    expect(state.availableEndTime).toBeNull();
  });

  // CRT-04에서 뒤로 돌아오면 시간 미선택 초기 화면이어야 한다(crt-03.md F03).
  it('should show the initial unselected state when re-entered with scheduleInputType DATE_ONLY', () => {
    useCreateMeetingDraft.setState({ scheduleInputType: 'DATE_ONLY' });

    render(<TimeRangeStep onNext={vi.fn()} />);

    // 시간 필드는 비어 있고(placeholder), 고른 값이 없으니 다음도 눌리지 않는다.
    expect(screen.getAllByText('시간 선택')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
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
