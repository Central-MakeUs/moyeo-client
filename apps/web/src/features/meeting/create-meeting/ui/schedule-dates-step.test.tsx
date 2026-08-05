import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { toast } from '@/shared/ui';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import type { UseServerTodayResult } from '../model/use-server-today';
import { ScheduleDatesStep } from './schedule-dates-step';

const { useServerToday } = vi.hoisted(() => ({ useServerToday: vi.fn() }));
vi.mock('../model/use-server-today', () => ({ useServerToday }));

const refetch = vi.fn();

/** 서버 시각 훅 상태를 상황별로 주입한다. */
const mockServerToday = (value: Partial<UseServerTodayResult>) => {
  useServerToday.mockReturnValue({
    serverToday: null,
    status: 'success',
    refetch,
    ...value,
  });
};

/** 선택된 날짜 셀 버튼 수. RDP가 <td>에도 data-selected를 붙이므로 button으로 한정. */
const selectedDays = (c: HTMLElement) => c.querySelectorAll('button[data-selected="true"]');

/** 7/1 ~ 7/N 까지의 ISO 배열. */
const julyDates = (count: number) =>
  Array.from({ length: count }, (_, i) => `2026-07-${String(i + 1).padStart(2, '0')}`);

describe('ScheduleDatesStep', () => {
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

    refetch.mockReset();
    useServerToday.mockReset();
    mockServerToday({ serverToday: '2026-07-10' });
    useCreateMeetingDraft.setState({ scheduleCandidateDates: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the calendar when status is 'success'", () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.getByText('2026년 7월')).toBeInTheDocument();
  });

  // serverToday는 실제 오늘과 다른 달이어야 한다. 같은 달이면 month prop을 지워도
  // react-day-picker가 실제 오늘의 달을 보여줘서 이 단언이 통과해버린다.
  it("should render 2026년 9월 when serverToday is '2026-09-03'", () => {
    mockServerToday({ serverToday: '2026-09-03' });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.getByText('2026년 9월')).toBeInTheDocument();
  });

  it('should keep the navigated month across a re-render when the user moves to the next month', async () => {
    mockServerToday({ serverToday: '2026-09-03' });
    const { rerender } = render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    rerender(<ScheduleDatesStep onNext={vi.fn()} />);

    // 재렌더에서 serverToday의 달(9월)로 되돌아가면 안 된다.
    expect(screen.getByText('2026년 10월')).toBeInTheDocument();
  });

  it("should set scheduleCandidateDates to ['2026-07-11','2026-07-12'] when 7/12 then 7/11 are tapped given serverToday '2026-07-10'", async () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('12'));
    await userEvent.click(screen.getByText('11'));

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual([
      '2026-07-11',
      '2026-07-12',
    ]);
  });

  it('should enable 다음 when one date is selected', async () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('11'));

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('should call onNext when 다음 is clicked with one date selected', async () => {
    const onNext = vi.fn();
    useCreateMeetingDraft.setState({ scheduleCandidateDates: ['2026-07-11'] });
    render(<ScheduleDatesStep onNext={onNext} />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("should render 2 selected day cells when draft has ['2026-07-11','2026-07-12']", () => {
    useCreateMeetingDraft.setState({ scheduleCandidateDates: ['2026-07-11', '2026-07-12'] });
    const { container } = render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(selectedDays(container)).toHaveLength(2);
  });

  it('should disable 다음 when no date is selected', () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("should clear scheduleCandidateDates when tapping 7/11 given draft ['2026-07-11']", async () => {
    useCreateMeetingDraft.setState({ scheduleCandidateDates: ['2026-07-11'] });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('11'));

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual([]);
  });

  it("should keep 21 dates and show '최대 21일까지 선택 가능' toast when tapping a 22nd date", async () => {
    const toastSpy = vi.spyOn(toast, 'add');
    mockServerToday({ serverToday: '2026-07-01' });
    useCreateMeetingDraft.setState({ scheduleCandidateDates: julyDates(21) });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('22'));

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: '최대 21일까지 선택 가능합니다' })
    );
    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toHaveLength(21);
    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).not.toContain('2026-07-22');
  });

  it('should call toast.add exactly once when tapping a 22nd date', async () => {
    const toastSpy = vi.spyOn(toast, 'add');
    mockServerToday({ serverToday: '2026-07-01' });
    useCreateMeetingDraft.setState({ scheduleCandidateDates: julyDates(21) });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('22'));

    // 제스처당 1회. 탭 한 번이 pointerdown·click 양쪽에서 토스트를 띄우면 안 된다.
    expect(toastSpy).toHaveBeenCalledTimes(1);
  });

  it("should render skeleton and disable 다음 when status is 'pending'", () => {
    mockServerToday({ serverToday: null, status: 'pending' });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('2026년 7월')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it("should render 다시 시도 and call refetch when status is 'error'", async () => {
    mockServerToday({ serverToday: null, status: 'error' });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("should render '날짜 정보를 불러오지 못했어요' when status is 'error'", () => {
    mockServerToday({ serverToday: null, status: 'error' });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.getByText('날짜 정보를 불러오지 못했어요')).toBeInTheDocument();
  });

  it("should not render the calendar when status is 'error'", () => {
    mockServerToday({ serverToday: null, status: 'error' });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.queryByText('2026년 7월')).not.toBeInTheDocument();
  });

  it("should render the calendar when status recovers from 'error' to 'success'", async () => {
    mockServerToday({ serverToday: null, status: 'error' });
    const { rerender } = render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    // 재시도가 성공한 상태를 훅이 돌려주는 상황.
    mockServerToday({ serverToday: '2026-07-10' });
    rerender(<ScheduleDatesStep onNext={vi.fn()} />);

    expect(screen.getByText('2026년 7월')).toBeInTheDocument();
    expect(screen.queryByText('날짜 정보를 불러오지 못했어요')).not.toBeInTheDocument();
  });

  it("should not change scheduleCandidateDates when tapping 7/9 given serverToday '2026-07-10'", async () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('9'));

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual([]);
  });

  // 위 케이스는 draft가 비어 있어 "선택되지 않는다"만 잡는다.
  // 기존 선택이 있을 때 그대로 보존되는지가 AC-5의 나머지 절반이다.
  it("should keep scheduleCandidateDates unchanged when tapping 7/9 given draft ['2026-07-15']", async () => {
    useCreateMeetingDraft.setState({ scheduleCandidateDates: ['2026-07-15'] });
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('9'));

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual(['2026-07-15']);
  });

  // 당일 차단 (#120 1차 결정). 시간표가 오늘 열을 날짜 단위로만 보고 통째로 열어두기 때문에,
  // 오늘을 후보로 허용하면 이미 지난 시간대가 응답으로 들어간다.
  it("should not change scheduleCandidateDates when tapping 7/10 given serverToday '2026-07-10'", async () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('10'));

    expect(useCreateMeetingDraft.getState().scheduleCandidateDates).toEqual([]);
  });

  it("should keep 다음 disabled when only 7/10 is tapped given serverToday '2026-07-10'", async () => {
    render(<ScheduleDatesStep onNext={vi.fn()} />);

    await userEvent.click(screen.getByText('10'));

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });
});
