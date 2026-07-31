import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useCellDragSelect, type UseCellDragSelectParams } from './use-cell-drag-select';

const AT_18 = '2026-07-10 18:00';
const AT_19 = '2026-07-10 19:00';
const AT_20 = '2026-07-10 20:00';

const setup = (params: Partial<UseCellDragSelectParams> = {}) => {
  const onChange = vi.fn();
  const { result } = renderHook(() => useCellDragSelect({ value: [], onChange, ...params }));

  return { result, onChange };
};

describe('useCellDragSelect', () => {
  it("should preview ['2026-07-10 18:00'] when starting on that cell and updating with it given value is []", () => {
    const { result } = setup();

    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18]));

    expect(result.current.previewValue).toEqual([AT_18]);
  });

  it('should call onChange with the previewed keys when commit is called', () => {
    const { result, onChange } = setup();

    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18, AT_19]));
    act(() => result.current.commit());

    expect(onChange).toHaveBeenCalledWith([AT_18, AT_19]);
  });

  it('should remove dragged keys when starting on an already selected cell (deselect mode)', () => {
    const { result, onChange } = setup({ value: [AT_18, AT_19] });

    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18, AT_19]));
    act(() => result.current.commit());

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should report isDragging true after start and false after commit', () => {
    const { result } = setup();

    act(() => result.current.start(AT_18));
    expect(result.current.isDragging).toBe(true);

    act(() => result.current.commit());
    expect(result.current.isDragging).toBe(false);
  });

  it('should keep the paint mode fixed when a later update includes an already selected cell', () => {
    const { result } = setup({ value: [AT_19] });

    // 앵커가 미선택(18:00)이라 이번 제스처는 select 모드로 고정된다.
    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18, AT_19]));

    expect(result.current.previewValue).toEqual([AT_18, AT_19]);
  });

  it('should return value unchanged as previewValue before any start is called', () => {
    const { result } = setup({ value: [AT_18] });

    expect(result.current.previewValue).toEqual([AT_18]);
    expect(result.current.isDragging).toBe(false);
  });

  it('should restore previewValue to value when cancel is called after update', () => {
    const { result } = setup({ value: [AT_18] });

    act(() => result.current.start(AT_19));
    act(() => result.current.update([AT_19, AT_20]));
    act(() => result.current.cancel());

    expect(result.current.previewValue).toEqual([AT_18]);
  });

  it('should not call onChange when cancel is called', () => {
    const { result, onChange } = setup();

    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18]));
    act(() => result.current.cancel());

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should shrink the preview when a later update covers fewer cells', () => {
    const { result } = setup();

    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18, AT_19, AT_20]));
    act(() => result.current.update([AT_18]));

    expect(result.current.previewValue).toEqual([AT_18]);
  });

  it('should ignore update when start was never called', () => {
    const { result } = setup({ value: [AT_18] });

    act(() => result.current.update([AT_19, AT_20]));

    expect(result.current.previewValue).toEqual([AT_18]);
    expect(result.current.isDragging).toBe(false);
  });

  it('should not call onChange when commit is called without a start', () => {
    const { result, onChange } = setup();

    act(() => result.current.commit());

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should exclude a disabled key from the preview when the drag covers it', () => {
    const { result } = setup({ disabledKeys: new Set([AT_19]) });

    act(() => result.current.start(AT_18));
    act(() => result.current.update([AT_18, AT_19]));

    expect(result.current.previewValue).toEqual([AT_18]);
  });
});
