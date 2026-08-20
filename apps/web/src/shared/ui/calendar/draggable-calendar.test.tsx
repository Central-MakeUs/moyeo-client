import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('DraggableCalendar — 드래그 페인트 (Issue 2)', () => {
  // 7월 그리드 마지막 주에는 8/1 같은 outside day도 렌더된다.
  // getByText('1')은 7/01과 8/01을 함께 잡으므로 data-date로 특정한다.
  const cell = (n: number) =>
    document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, '0')}"]`)!;
  const dayNums = (dates: Date[]) => dates.map((x) => x.getDate()).sort((a, b) => a - b);

  it('should call onChange with [7/09..7/13] when pointer-dragging 7/09→7/13', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(13));
    fireEvent.pointerUp(cell(13));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayNums(onChange.mock.calls[0]![0])).toEqual([9, 10, 11, 12, 13]);
  });

  it('should allow the next tap to toggle immediately after a drag commit', async () => {
    const { container } = render(<StatefulHarness />);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(13));
    fireEvent.pointerUp(cell(13));

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await userEvent.click(cell(15));

    const selectedNums = [...selectedDays(container)]
      .map((button) => Number(button.textContent))
      .sort((a, b) => a - b);
    expect(selectedNums).toEqual([9, 10, 11, 12, 13, 15]);
  });

  it('should mark 7/09~7/13 cells data-selected during active drag before pointerup', () => {
    const { container } = render(<MonthHarness value={[]} onChange={vi.fn()} />);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(13));

    const previewNums = [...container.querySelectorAll('button[data-selected="true"]')]
      .map((b) => Number(b.textContent))
      .sort((a, b) => a - b);
    expect(previewNums).toEqual([9, 10, 11, 12, 13]);
  });

  it('should cancel the drag (no onChange, no selection change) when the pointer leaves the calendar area mid-drag', () => {
    const onChange = vi.fn();
    const { container } = render(<MonthHarness value={[]} onChange={onChange} />);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(13));
    fireEvent.pointerLeave(container.firstChild as Element);

    expect(container.querySelectorAll('button[data-selected="true"]')).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not resume a canceled drag when the pointer re-enters a cell', () => {
    const onChange = vi.fn();
    const { container } = render(<MonthHarness value={[]} onChange={onChange} />);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(13));
    fireEvent.pointerLeave(container.firstChild as Element); // 취소
    fireEvent.pointerEnter(cell(15)); // 재진입 — 재개되면 안 됨
    fireEvent.pointerUp(cell(15));

    expect(container.querySelectorAll('button[data-selected="true"]')).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should shrink to [7/10] when dragging 7/10→7/15 then back to anchor 7/10', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);

    fireEvent.pointerDown(cell(10)); // anchor = 7/10
    fireEvent.pointerEnter(cell(15)); // 7/10~7/15 로 확장
    fireEvent.pointerEnter(cell(10)); // 다시 anchor 로 되돌림 → [10] 으로 축소돼야 함
    fireEvent.pointerUp(cell(10));

    expect(dayNums(onChange.mock.calls[0]![0])).toEqual([10]);
  });

  it('should shrink to [7/10, 7/11] when dragging 7/10→7/15 then back to 7/11 (대조군)', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);

    fireEvent.pointerDown(cell(10)); // anchor = 7/10
    fireEvent.pointerEnter(cell(15)); // 7/10~7/15 로 확장
    fireEvent.pointerEnter(cell(11)); // anchor 아닌 셀로 되돌림 → 정상 축소
    fireEvent.pointerUp(cell(11));

    expect(dayNums(onChange.mock.calls[0]![0])).toEqual([10, 11]);
  });
});

describe('DraggableCalendar — 개수 제한 (Issue 3)', () => {
  // 7월 그리드 마지막 주에는 8/1 같은 outside day도 렌더된다.
  // getByText('1')은 7/01과 8/01을 함께 잡으므로 data-date로 특정한다.
  const cell = (n: number) =>
    document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, '0')}"]`)!;
  const dayNums = (dates: Date[]) => dates.map((x) => x.getDate()).sort((a, b) => a - b);
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);

  it('should not add the tapped day and call onLimitExceeded once when tapping a new day given value already has 21 dates, maxSelectedDays=21', async () => {
    const onChange = vi.fn();
    const onLimitExceeded = vi.fn();
    render(
      <MonthHarness
        value={range(1, 21).map((n) => d(n))} // 7/01..7/21 = 21개(한계)
        onChange={onChange}
        maxSelectedDays={21}
        onLimitExceeded={onLimitExceeded}
      />
    );

    await userEvent.click(cell(23)); // 새 날짜 추가 시도 → 22개

    expect(onChange).not.toHaveBeenCalled();
    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
  });

  it('should call onChange with [7/01..7/21] and onLimitExceeded once when pointer-dragging 7/01→7/25, maxSelectedDays=21', () => {
    const onChange = vi.fn();
    const onLimitExceeded = vi.fn();
    render(
      <MonthHarness
        value={[]}
        onChange={onChange}
        maxSelectedDays={21}
        onLimitExceeded={onLimitExceeded}
      />
    );

    fireEvent.pointerDown(cell(1));
    fireEvent.pointerEnter(cell(25));
    fireEvent.pointerUp(cell(25));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayNums(onChange.mock.calls[0]![0])).toEqual(range(1, 21));
    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
  });
});

describe('DraggableCalendar — 연속 런 세그먼트 렌더링 (Issue 4)', () => {
  it('should set data-range-start on 7/10, data-range-middle on 7/11, data-range-end on 7/12, data-selected-single on 7/20 when value=[7/10, 7/11, 7/12, 7/20]', () => {
    render(<MonthHarness value={[d(10), d(11), d(12), d(20)]} onChange={vi.fn()} />);

    expect(screen.getByText('10')).toHaveAttribute('data-range-start', 'true');
    expect(screen.getByText('11')).toHaveAttribute('data-range-middle', 'true');
    expect(screen.getByText('12')).toHaveAttribute('data-range-end', 'true');
    expect(screen.getByText('20')).toHaveAttribute('data-selected-single', 'true');
  });

  it('should set data-selected-single=true and all data-range-* false on 7/15 when value=[7/15] (단독 1일)', () => {
    render(<MonthHarness value={[d(15)]} onChange={vi.fn()} />);

    const cell = screen.getByText('15');
    expect(cell).toHaveAttribute('data-selected-single', 'true');
    expect(cell).not.toHaveAttribute('data-range-start', 'true');
    expect(cell).not.toHaveAttribute('data-range-middle', 'true');
    expect(cell).not.toHaveAttribute('data-range-end', 'true');
  });

  it('should NOT mark run members as selected-single when value=[7/10, 7/11, 7/12] (밴드는 single 아님)', () => {
    render(<MonthHarness value={[d(10), d(11), d(12)]} onChange={vi.fn()} />);

    // 밴드 3칸은 range-start/middle/end일 뿐, solid single 이 함께 켜지면 안 된다.
    expect(screen.getByText('10')).toHaveAttribute('data-selected-single', 'false');
    expect(screen.getByText('11')).toHaveAttribute('data-selected-single', 'false');
    expect(screen.getByText('12')).toHaveAttribute('data-selected-single', 'false');
  });
});

describe('DraggableCalendar — 런 재렌더 (Issue 4, 상태 변화)', () => {
  // 7월 그리드 마지막 주에는 8/1 같은 outside day도 렌더된다.
  // getByText('1')은 7/01과 8/01을 함께 잡으므로 data-date로 특정한다.
  const cell = (n: number) =>
    document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, '0')}"]`)!;

  // value를 상태로 들고 초기값을 주입하는 제어 하네스 (드래그 확정/토글 후 재렌더 검증용).
  function ControlledHarness({ initial }: { initial: Date[] }) {
    const [value, setValue] = useState<Date[]>(initial);
    return (
      <DraggableCalendar
        value={value}
        onChange={setValue}
        month={JULY_2026}
        onMonthChange={() => {}}
      />
    );
  }

  it('should render the run band (start/middle/end) after a drag is released 7/10→7/14', () => {
    render(<ControlledHarness initial={[]} />);

    fireEvent.pointerDown(cell(10));
    fireEvent.pointerEnter(cell(14));
    fireEvent.pointerUp(cell(14));

    expect(cell(10)).toHaveAttribute('data-range-start', 'true');
    expect(cell(11)).toHaveAttribute('data-range-middle', 'true');
    expect(cell(12)).toHaveAttribute('data-range-middle', 'true');
    expect(cell(13)).toHaveAttribute('data-range-middle', 'true');
    expect(cell(14)).toHaveAttribute('data-range-end', 'true');
  });

  it('should split the run and reclassify neighbors as end/start when a middle day 7/12 is toggled off', async () => {
    render(<ControlledHarness initial={[d(10), d(11), d(12), d(13), d(14)]} />);

    await userEvent.click(cell(12)); // 중간 해제 → [7/10,7/11] · [7/13,7/14] 두 밴드로 분리

    expect(cell(11)).toHaveAttribute('data-range-end', 'true'); // 11: middle → end
    expect(cell(11)).not.toHaveAttribute('data-range-middle', 'true');
    expect(cell(13)).toHaveAttribute('data-range-start', 'true'); // 13: middle → start
    expect(cell(13)).not.toHaveAttribute('data-range-middle', 'true');
    expect(cell(10)).toHaveAttribute('data-range-start', 'true'); // 양끝 유지
    expect(cell(14)).toHaveAttribute('data-range-end', 'true');
    expect(cell(12)).not.toHaveAttribute('data-selected', 'true'); // 해제됨
  });
});

describe('DraggableCalendar — 셀 리마운트 방지 (실브라우저 드래그 무결성)', () => {
  // 7월 그리드 마지막 주에는 8/1 같은 outside day도 렌더된다.
  // getByText('1')은 7/01과 8/01을 함께 잡으므로 data-date로 특정한다.
  const cell = (n: number) =>
    document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, '0')}"]`)!;

  // 드래그 시작(state 변경) 시 셀 DOM 노드가 교체되면 실제 브라우저에서 포인터 제스처가 끊긴다.
  // 같은 노드가 유지돼야(리렌더 O, 리마운트 X) 드래그가 이어진다.
  it('should keep the same day cell DOM node across a drag state change (no remount)', () => {
    render(<StatefulHarness />);
    const before = cell(10);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(10)); // drag.start → setState → re-render

    expect(cell(10)).toBe(before);
  });
});

describe('DraggableCalendar — 모바일 터치 (Issue 5)', () => {
  // 7월 그리드 마지막 주에는 8/1 같은 outside day도 렌더된다.
  // getByText('1')은 7/01과 8/01을 함께 잡으므로 data-date로 특정한다.
  const cell = (n: number) =>
    document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, '0')}"]`)!;
  const dayNums = (dates: Date[]) => dates.map((x) => x.getDate()).sort((a, b) => a - b);
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);

  // jsdom엔 elementFromPoint가 없어 직접 mock을 심는다(레이아웃 없음 → 원래 null).
  const elementFromPoint = vi.fn<(x: number, y: number) => Element | null>();
  const originalElementFromPoint = document.elementFromPoint;
  const touch = { pointerType: 'touch', pointerId: 1 } as const;

  beforeEach(() => {
    elementFromPoint.mockReset();
    document.elementFromPoint = elementFromPoint;
  });

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
  });

  it('should render the 7/13 day cell with data-date="2026-07-13"', () => {
    render(<MonthHarness value={[]} onChange={vi.fn()} />);

    expect(cell(13)).toHaveAttribute('data-date', '2026-07-13');
  });

  it('should apply the touch-none class (touch-action:none) on day cells', () => {
    render(<MonthHarness value={[]} onChange={vi.fn()} />);

    expect(cell(13)).toHaveClass('touch-none');
  });

  it('should call onChange with [7/09..7/13] on a touch drag when pointerDown(7/09) → pointerMove(→7/13) → pointerUp', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);
    elementFromPoint.mockReturnValue(cell(13));

    fireEvent.pointerDown(cell(9), touch);
    fireEvent.pointerMove(cell(9), { ...touch, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(cell(9), touch);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayNums(onChange.mock.calls[0]![0])).toEqual([9, 10, 11, 12, 13]);
  });

  it('should select the full 7/09~7/18 on a fast touch drag when only the final coordinate resolves to 7/18', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);
    elementFromPoint.mockReturnValue(cell(18));

    fireEvent.pointerDown(cell(9), touch);
    fireEvent.pointerMove(cell(9), { ...touch, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(cell(9), touch);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayNums(onChange.mock.calls[0]![0])).toEqual(range(9, 18));
  });

  it('should ignore a pointermove that resolves to no cell (elementFromPoint null) mid-drag and still commit [7/09..7/13]', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} />);
    elementFromPoint.mockReturnValueOnce(cell(13)).mockReturnValueOnce(null);

    fireEvent.pointerDown(cell(9), touch);
    fireEvent.pointerMove(cell(9), { ...touch, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(cell(9), { ...touch, clientX: 999, clientY: 999 }); // off-grid → null
    fireEvent.pointerUp(cell(9), touch);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(dayNums(onChange.mock.calls[0]![0])).toEqual([9, 10, 11, 12, 13]);
  });
});

describe('DraggableCalendar — 제출 중 잠금', () => {
  const cell = (n: number) =>
    document.querySelector<HTMLElement>(`[data-date="2026-07-${String(n).padStart(2, '0')}"]`)!;

  it('should not call onChange when tapping a day while disabled', async () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} disabled />);

    await userEvent.click(screen.getByText('15'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not call onChange when dragging while disabled', () => {
    const onChange = vi.fn();
    render(<MonthHarness value={[]} onChange={onChange} disabled />);

    fireEvent.pointerDown(cell(9));
    fireEvent.pointerEnter(cell(13));
    fireEvent.pointerUp(cell(13));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not call onMonthChange when navigating months while disabled', () => {
    // 월을 넘겨두면 제출이 끝나 화면이 바뀔 때 사용자가 보던 달과 어긋난다.
    const onMonthChange = vi.fn();
    render(
      <DraggableCalendar
        value={[]}
        onChange={vi.fn()}
        month={JULY_2026}
        onMonthChange={onMonthChange}
        disabled
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onMonthChange).not.toHaveBeenCalled();
  });

  it('should keep already selected days visible while disabled', () => {
    const { container } = render(<MonthHarness value={[d(15)]} onChange={vi.fn()} disabled />);

    expect(selectedDays(container)).toHaveLength(1);
  });
});
