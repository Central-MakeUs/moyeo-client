import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AvailabilityTimeGrid, LONG_PRESS_MS } from './availability-time-grid';

const COLUMNS = ['2026-07-10', '2026-07-11'];
const ROWS = ['18:00', '19:00', '20:00'];

const cell = (container: HTMLElement, key: string) =>
  container.querySelector<HTMLButtonElement>(`[data-cell-key="${key}"]`);

const allCells = (container: HTMLElement) => container.querySelectorAll('[data-cell-key]');

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

    const grid = container.firstElementChild;
    const columnHeaderRow = container.querySelector('[data-time-grid-column-header-row]');
    const columnHeader = container.querySelector('[data-time-grid-column-header="2026-07-10"]');
    const rowHeader = container.querySelector('[data-time-grid-row-header="18:00"]');
    const corner = container.querySelector('[data-time-grid-corner]');

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
    fireEvent.pointerCancel(container.firstElementChild!);

    expect(onChange).not.toHaveBeenCalled();
  });
});

/**
 * 손가락 하나로 스크롤과 선택을 모두 해야 해서, 터치는 롱프레스로 의도를 가른다.
 * 이동 방향으로는 나눌 수 없다 — 선택도 스크롤도 가로·세로를 모두 쓰기 때문이다.
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
    fireEvent.pointerMove(container.firstElementChild!, { ...touch, clientX: 10, clientY: 40 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(container.firstElementChild!, touch);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('움직이지 않고 300ms 유지하면 onSelectionStart가 호출된다', () => {
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
