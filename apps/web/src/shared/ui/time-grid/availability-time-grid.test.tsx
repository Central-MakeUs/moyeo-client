import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AvailabilityTimeGrid, LONG_PRESS_MS } from './availability-time-grid';

const COLUMNS = ['2026-07-10', '2026-07-11'];
const ROWS = ['18:00', '19:00', '20:00'];

const cell = (container: HTMLElement, key: string) =>
  container.querySelector<HTMLButtonElement>(`[data-cell-key="${key}"]`);

const allCells = (container: HTMLElement) => container.querySelectorAll('[data-cell-key]');
const scrollGrid = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-time-grid-scroll]')!;

describe('AvailabilityTimeGrid', () => {
  it('should render 6 cells when columns has 2 dates and rows has 3 times', () => {
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} />
    );

    expect(allCells(container)).toHaveLength(6);
  });

  it("should render column headers '7/10' and '7/11'", () => {
    render(<AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('7/11')).toBeInTheDocument();
  });

  it("should render row label '18:00'", () => {
    render(<AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} />);

    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('should keep column headers, row headers, and the corner cell sticky while the grid owns both scroll axes', () => {
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} />
    );

    const grid = scrollGrid(container);
    const columnHeaderRow = container.querySelector('[data-time-grid-column-header-row]');
    const columnHeader = container.querySelector('[data-time-grid-column-header="2026-07-10"]');
    const rowHeader = container.querySelector('[data-time-grid-row-header="18:00"]');
    const corner = container.querySelector('[data-time-grid-corner]');

    expect(grid.parentElement).toHaveClass('flex', 'min-h-0', 'flex-col');
    expect(grid).toHaveClass('min-h-0', 'flex-1');
    expect(grid).toHaveClass('overflow-auto');
    expect(columnHeaderRow).toHaveClass('sticky', 'top-0', 'z-20', 'bg-white');
    expect(columnHeader).toHaveClass('bg-white');
    expect(columnHeader).not.toHaveClass('sticky');
    expect(rowHeader).toHaveClass('sticky', 'left-0', 'z-10', 'bg-white');
    expect(corner).toHaveClass('sticky', 'left-0', 'z-30', 'bg-white');
  });

  it('should give every cell an accessible name', () => {
    render(<AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '7월 10일 18시' })).toBeInTheDocument();
  });

  it("should call onChange with ['2026-07-10 18:00'] when tapping that cell given value is []", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} />
    );

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(onChange).toHaveBeenCalledWith(['2026-07-10 18:00']);
  });

  it("should call onChange with [] when tapping '2026-07-10 18:00' given value is ['2026-07-10 18:00']", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={['2026-07-10 18:00']}
        onChange={onChange}
      />
    );

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should render no cells when rows is []', () => {
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={[]} value={[]} onChange={vi.fn()} />
    );

    expect(allCells(container)).toHaveLength(0);
  });

  it('should not call onChange when tapping a disabled cell', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={[]}
        onChange={onChange}
        disabledKeys={new Set(['2026-07-10 18:00'])}
      />
    );

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should apply bg-accessible-100 to a selected cell, bg-neutral-0 to a disabled cell and bg-neutral-10 to a default cell', () => {
    const { container } = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={['2026-07-10 18:00']}
        onChange={vi.fn()}
        disabledKeys={new Set(['2026-07-10 19:00'])}
      />
    );

    expect(cell(container, '2026-07-10 18:00')).toHaveClass('bg-accessible-100');
    expect(cell(container, '2026-07-10 19:00')).toHaveClass('bg-neutral-0');
    expect(cell(container, '2026-07-10 20:00')).toHaveClass('bg-neutral-10');
  });
});

// 드래그 메커니즘은 DraggableCalendar와 동일하고, 기하만 사각형(2D)이다.
describe('AvailabilityTimeGrid — 드래그 페인트', () => {
  const drag = (container: HTMLElement, fromKey: string, toKey: string) => {
    fireEvent.pointerDown(cell(container, fromKey)!);
    fireEvent.pointerEnter(cell(container, toKey)!);
    fireEvent.pointerUp(cell(container, toKey)!);
  };

  it('should call onChange with the 4 rectangle cells when dragging 2026-07-10 18:00 to 2026-07-11 19:00', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} />
    );

    drag(container, '2026-07-10 18:00', '2026-07-11 19:00');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      '2026-07-10 18:00',
      '2026-07-10 19:00',
      '2026-07-11 18:00',
      '2026-07-11 19:00',
    ]);
  });

  it('should select the same 4 cells when dragging in reverse', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} />
    );

    drag(container, '2026-07-11 19:00', '2026-07-10 18:00');

    expect(onChange).toHaveBeenCalledWith([
      '2026-07-10 18:00',
      '2026-07-10 19:00',
      '2026-07-11 18:00',
      '2026-07-11 19:00',
    ]);
  });

  it('should deselect the dragged rectangle when the drag starts on an already selected cell', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={['2026-07-10 18:00', '2026-07-10 19:00', '2026-07-10 20:00']}
        onChange={onChange}
      />
    );

    drag(container, '2026-07-10 18:00', '2026-07-10 19:00');

    expect(onChange).toHaveBeenCalledWith(['2026-07-10 20:00']);
  });

  it('should preview the dragged rectangle before pointerup', () => {
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} />
    );

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!);
    fireEvent.pointerEnter(cell(container, '2026-07-11 19:00')!);

    expect(container.querySelectorAll('[data-cell-key][aria-pressed="true"]')).toHaveLength(4);
  });

  it('should skip a disabled cell inside the dragged rectangle', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={[]}
        onChange={onChange}
        disabledKeys={new Set(['2026-07-10 19:00'])}
      />
    );

    drag(container, '2026-07-10 18:00', '2026-07-10 20:00');

    expect(onChange).toHaveBeenCalledWith(['2026-07-10 18:00', '2026-07-10 20:00']);
  });

  it('should not call onChange twice when a click follows the drag commit', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} />
    );

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!);
    fireEvent.pointerEnter(cell(container, '2026-07-10 19:00')!);
    fireEvent.pointerUp(cell(container, '2026-07-10 19:00')!);
    fireEvent.click(cell(container, '2026-07-10 19:00')!);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // 이 그리드는 스크롤 컨테이너라 가장자리 접근이 자동 스크롤 트리거다.
  // 경계를 벗어났다고 취소하면 자동 스크롤과 충돌하므로, 취소는 pointercancel에서만 한다.
  it('드래그 중 포인터가 그리드 경계를 벗어나도 취소하지 않는다', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} />
    );

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!);
    fireEvent.pointerEnter(cell(container, '2026-07-10 20:00')!);
    fireEvent.pointerLeave(container.firstElementChild!);
    fireEvent.pointerUp(cell(container, '2026-07-10 20:00')!);

    expect(onChange).toHaveBeenCalledWith([
      '2026-07-10 18:00',
      '2026-07-10 19:00',
      '2026-07-10 20:00',
    ]);
  });

  it('pointercancel이 오면 진행 중인 선택을 커밋하지 않는다', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} />
    );

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!);
    fireEvent.pointerEnter(cell(container, '2026-07-10 20:00')!);
    fireEvent.pointerCancel(scrollGrid(container));

    expect(onChange).not.toHaveBeenCalled();
  });
});

/**
 * 손가락 하나로 스크롤과 선택을 모두 해야 해서, 터치는 롱프레스로 의도를 가른다.
 * 일반 팬은 최초 우세 축으로 잠그고, 롱프레스가 먼저 성립하면 2D 선택으로 전환한다.
 */
describe('AvailabilityTimeGrid — 터치 롱프레스', () => {
  const touch = { pointerType: 'touch', pointerId: 1 } as const;

  beforeEach(() => {
    vi.useFakeTimers();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderGrid = (props?: Partial<React.ComponentProps<typeof AvailabilityTimeGrid>>) => {
    const onChange = vi.fn();
    const view = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={[]}
        onChange={onChange}
        {...props}
      />
    );
    return { ...view, onChange };
  };

  it('롱프레스 전에 8px 넘게 움직이면 선택이 시작되지 않는다', () => {
    const { container, onChange } = renderGrid();
    const start = cell(container, '2026-07-10 18:00')!;

    fireEvent.pointerDown(start, { ...touch, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(scrollGrid(container), { ...touch, clientX: 10, clientY: 40 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(scrollGrid(container), touch);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('gap에서 시작한 가로 팬은 손을 뗄 때까지 x축만 스크롤한다', () => {
    const { container } = renderGrid();
    const grid = scrollGrid(container);

    fireEvent.pointerDown(grid, { ...touch, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(grid, { ...touch, clientX: 20, clientY: 45 });
    act(() => vi.advanceTimersByTime(16));

    expect(grid.scrollLeft).toBe(30);
    expect(grid.scrollTop).toBe(0);

    fireEvent.pointerMove(grid, { ...touch, clientX: 10, clientY: 5 });
    act(() => vi.advanceTimersByTime(16));

    expect(grid.scrollLeft).toBe(40);
    expect(grid.scrollTop).toBe(0);
  });

  it('gap에서 시작한 세로 팬은 손을 뗄 때까지 y축만 스크롤한다', () => {
    const { container } = renderGrid();
    const grid = scrollGrid(container);

    fireEvent.pointerDown(grid, { ...touch, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(grid, { ...touch, clientX: 45, clientY: 20 });
    act(() => vi.advanceTimersByTime(16));

    expect(grid.scrollLeft).toBe(0);
    expect(grid.scrollTop).toBe(30);

    fireEvent.pointerMove(grid, { ...touch, clientX: 5, clientY: 10 });
    act(() => vi.advanceTimersByTime(16));

    expect(grid.scrollLeft).toBe(0);
    expect(grid.scrollTop).toBe(40);
  });

  it('빠르게 밀고 손을 떼면 잠긴 축으로 관성 스크롤을 이어간다', () => {
    const { container } = renderGrid();
    const grid = scrollGrid(container);
    const down = createEvent.pointerDown(grid, {
      ...touch,
      clientX: 50,
      clientY: 50,
    });
    const move = createEvent.pointerMove(grid, {
      ...touch,
      clientX: 20,
      clientY: 48,
    });
    const up = createEvent.pointerUp(grid, {
      ...touch,
      clientX: 20,
      clientY: 48,
    });
    Object.defineProperty(down, 'timeStamp', { value: 100 });
    Object.defineProperty(move, 'timeStamp', { value: 150 });
    Object.defineProperty(up, 'timeStamp', { value: 160 });

    fireEvent(grid, down);
    fireEvent(grid, move);
    act(() => vi.advanceTimersByTime(16));
    const positionAtRelease = grid.scrollLeft;

    fireEvent(grid, up);
    act(() => vi.advanceTimersByTime(48));

    expect(positionAtRelease).toBe(30);
    expect(grid.scrollLeft).toBeGreaterThan(positionAtRelease);
    expect(grid.scrollTop).toBe(0);
  });

  it('움직이지 않고 200ms 유지하면 onSelectionStart가 호출된다', () => {
    const onSelectionStart = vi.fn();
    const { container } = renderGrid({ onSelectionStart });

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!, {
      ...touch,
      clientX: 10,
      clientY: 10,
    });
    act(() => vi.advanceTimersByTime(LONG_PRESS_MS));

    expect(onSelectionStart).toHaveBeenCalledTimes(1);
  });

  it('롱프레스 전에 손을 떼면 onSelectionStart가 호출되지 않는다', () => {
    const onSelectionStart = vi.fn();
    const { container } = renderGrid({ onSelectionStart });
    const start = cell(container, '2026-07-10 18:00')!;

    fireEvent.pointerDown(start, { ...touch, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(start, touch);
    act(() => vi.advanceTimersByTime(500));

    expect(onSelectionStart).not.toHaveBeenCalled();
  });

  it('마우스는 롱프레스 없이 즉시 드래그로 선택된다', () => {
    const { container, onChange } = renderGrid();

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!);
    fireEvent.pointerEnter(cell(container, '2026-07-10 19:00')!);
    fireEvent.pointerUp(cell(container, '2026-07-10 19:00')!);

    expect(onChange).toHaveBeenCalledWith(['2026-07-10 18:00', '2026-07-10 19:00']);
  });
});

describe('AvailabilityTimeGrid — 제출 중 잠금', () => {
  const drag = (container: HTMLElement, fromKey: string, toKey: string) => {
    fireEvent.pointerDown(cell(container, fromKey)!);
    fireEvent.pointerEnter(cell(container, toKey)!);
    fireEvent.pointerUp(cell(container, toKey)!);
  };

  it('should not call onChange when tapping a cell while disabled', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} disabled />
    );

    await userEvent.click(cell(container, '2026-07-10 18:00')!);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not call onChange when dragging while disabled', () => {
    // 드래그 핸들러는 셀이 아니라 컨테이너에 있어, 셀 disabled만으로는 이 경로가 막히지 않는다.
    const onChange = vi.fn();
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={onChange} disabled />
    );

    drag(container, '2026-07-10 18:00', '2026-07-11 19:00');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should not preview a selection while disabled', () => {
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} disabled />
    );

    fireEvent.pointerDown(cell(container, '2026-07-10 18:00')!);
    fireEvent.pointerEnter(cell(container, '2026-07-11 19:00')!);

    expect(container.querySelectorAll('[data-cell-key][aria-pressed="true"]')).toHaveLength(0);
  });

  it('should keep the grid scrollable while disabled', () => {
    const { container } = render(
      <AvailabilityTimeGrid columns={COLUMNS} rows={ROWS} value={[]} onChange={vi.fn()} disabled />
    );

    expect(scrollGrid(container)).toHaveClass('overflow-auto');
    expect(scrollGrid(container)).not.toHaveClass('pointer-events-none');
  });

  it('should keep already selected cells visible while disabled', () => {
    // 잠금은 "바꿀 수 없다"이지 "안 보인다"가 아니다.
    const { container } = render(
      <AvailabilityTimeGrid
        columns={COLUMNS}
        rows={ROWS}
        value={['2026-07-10 18:00']}
        onChange={vi.fn()}
        disabled
      />
    );

    expect(cell(container, '2026-07-10 18:00')).toHaveClass('bg-accessible-100');
  });
});
