import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import type { UseServerTodayResult } from '../model/use-server-today';
import { ScheduleTimesStep } from './schedule-times-step';

const { useServerToday } = vi.hoisted(() => ({ useServerToday: vi.fn() }));
vi.mock('../model/use-server-today', () => ({ useServerToday }));

const refetch = vi.fn();

const mockServerToday = (value: Partial<UseServerTodayResult>) => {
  useServerToday.mockReturnValue({ serverToday: null, status: 'success', refetch, ...value });
};

const cell = (container: HTMLElement, key: string) =>
  container.querySelector<HTMLButtonElement>(`[data-cell-key="${key}"]`);

const allCells = (container: HTMLElement) => container.querySelectorAll('[data-cell-key]');

const selectedCells = (container: HTMLElement) =>
  container.querySelectorAll('[data-cell-key][aria-pressed="true"]');

/** 후보 날짜 2개 + 공통 범위 18:00~21:00(3행). */
const baseDraft = {
  scheduleCandidateDates: ['2026-07-10', '2026-07-11'],
  availableStartTime: '18:00',
  availableEndTime: '21:00',
  scheduleResponse: null,
};

describe('ScheduleTimesStep', () => {
  beforeEach(() => {
    refetch.mockReset();
    useServerToday.mockReset();
    mockServerToday({ serverToday: '2026-07-01' });
    useCreateMeetingDraft.setState(baseDraft);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render 6 cells when 2 candidate dates and a 3-hour common range are set', () => {
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    expect(allCells(container)).toHaveLength(6);
  });

  it('should store one merged range in the draft when 18:00 and 19:00 of 2026-07-10 are tapped', async () => {
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    await userEvent.click(cell(container, '2026-07-10 18:00')!);
    await userEvent.click(cell(container, '2026-07-10 19:00')!);

    expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
      availableTimeRanges: [{ candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' }],
    });
  });

  it('should render 2 selected cells when the draft already has the 18:00~20:00 range', () => {
    useCreateMeetingDraft.setState({
      ...baseDraft,
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
        ],
      },
    });
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    expect(selectedCells(container)).toHaveLength(2);
  });

  it('should enable 다음 when one cell is selected', async () => {
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('should disable 다음 when no cell is selected', () => {
    render(<ScheduleTimesStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('should store an empty availableTimeRanges when the last selected cell is deselected', async () => {
    useCreateMeetingDraft.setState({
      ...baseDraft,
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-07-10', startTime: '18:00', endTime: '19:00' },
        ],
      },
    });
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(useCreateMeetingDraft.getState().scheduleResponse).toEqual({
      availableTimeRanges: [],
    });
  });

  it('마지막 셀까지 해제하면 다음이 다시 비활성이 된다', async () => {
    useCreateMeetingDraft.setState({
      ...baseDraft,
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-07-10', startTime: '18:00', endTime: '19:00' },
        ],
      },
    });
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('should not change the draft when tapping a cell of a date before serverToday', async () => {
    mockServerToday({ serverToday: '2026-07-11' });
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(useCreateMeetingDraft.getState().scheduleResponse).toBeNull();
  });

  it('should never write availableDates into the draft', async () => {
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(useCreateMeetingDraft.getState().scheduleResponse?.availableDates).toBeUndefined();
  });

  it('should render skeleton and disable 다음 when the server time is pending', () => {
    mockServerToday({ serverToday: null, status: 'pending' });
    const { container } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(allCells(container)).toHaveLength(0);
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('should keep scheduleResponse in the draft when the step unmounts (뒤로가기 보존)', () => {
    useCreateMeetingDraft.setState({
      ...baseDraft,
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
        ],
      },
    });
    const { unmount } = render(<ScheduleTimesStep onNext={vi.fn()} />);

    unmount();

    expect(useCreateMeetingDraft.getState().scheduleResponse?.availableTimeRanges).toHaveLength(1);
  });
});
