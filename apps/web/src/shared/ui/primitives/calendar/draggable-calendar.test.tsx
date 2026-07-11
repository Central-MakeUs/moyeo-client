import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DraggableCalendar, type DraggableCalendarProps } from './draggable-calendar';

const JULY_2026 = new Date(2026, 6, 1);
const d = (day: number) => new Date(2026, 6, day);

// 표시 월(month)을 상태로 관리하는 제어 하네스. value/onChange/isDateDisabled는 주입.
function MonthHarness(props: Omit<DraggableCalendarProps, 'month' | 'onMonthChange'>) {
  const [month, setMonth] = useState<Date>(JULY_2026);
  return <DraggableCalendar {...props} month={month} onMonthChange={setMonth} />;
}

// value까지 상태로 관리하는 완전 stateful 하네스 (실사용 누적 검증용).
function StatefulHarness() {
  const [value, setValue] = useState<Date[]>([]);
  const [month, setMonth] = useState<Date>(JULY_2026);
  return (
    <DraggableCalendar value={value} onChange={setValue} month={month} onMonthChange={setMonth} />
  );
}

// 선택된 "날짜" 수 = 선택된 day 버튼 수. (RDP가 <td>에도 data-selected를 붙이므로 button으로 한정)
const selectedDays = (c: HTMLElement) => c.querySelectorAll('button[data-selected="true"]');

describe('DraggableCalendar', () => {
  it('should call onChange with [7/15] when tapping 7/15 given value=[]', async () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);

    await userEvent.click(screen.getByText('15'));

    expect(onChange).toHaveBeenCalledWith([d(15)]);
  });

  it('should call onChange with [] when tapping 7/15 given value=[7/15] (토글 해제)', async () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[d(15)]} onChange={onChange} />);

    await userEvent.click(screen.getByText('15'));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should call onChange with [7/15, 7/20] when tapping 7/20 given value=[7/15] (누적)', async () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[d(15)]} onChange={onChange} />);

    await userEvent.click(screen.getByText('20'));

    expect(onChange).toHaveBeenCalledWith([d(15), d(20)]);
  });

  it('should keep 7/15 selected after navigating Jul→Aug→Jul given value=[7/15]', async () => {
    const { container } = render(<MonthHarness value={[d(15)]} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /prev/i }));

    expect(selectedDays(container)).toHaveLength(1);
  });

  it('should render zero selected cells when value=[]', () => {
    const { container } = render(<MonthHarness value={[]} onChange={vi.fn()} />);

    expect(selectedDays(container)).toHaveLength(0);
  });

  it('should not call onChange when tapping a disabled day 7/09', async () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} isDateDisabled={(x) => x < d(10)} />);

    await userEvent.click(screen.getByText('9'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not select a disabled day 7/09 when tapped', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MonthHarness value={[]} onChange={onChange} isDateDisabled={(x) => x < d(10)} />
    );

    await userEvent.click(screen.getByText('9'));

    expect(selectedDays(container)).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should accumulate (1→2→3) and toggle off (→2) as days are tapped (실사용 누적)', async () => {
    const { container } = render(<StatefulHarness />);

    await userEvent.click(screen.getByText('15'));
    expect(selectedDays(container)).toHaveLength(1);

    await userEvent.click(screen.getByText('20'));
    expect(selectedDays(container)).toHaveLength(2);

    await userEvent.click(screen.getByText('25'));
    expect(selectedDays(container)).toHaveLength(3);

    await userEvent.click(screen.getByText('20'));
    expect(selectedDays(container)).toHaveLength(2);
  });
});
