import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDragSelect } from './use-drag-select';

// 2026-07 컨텍스트 헬퍼. 결과는 "선택된 날짜의 day 숫자(오름차순)"로 비교(순서 무관).
const d = (day: number) => new Date(2026, 6, day);
const days = (dates: Date[]) => dates.map((x) => x.getDate()).sort((a, b) => a - b);
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('useDragSelect', () => {
  // --- 정상 ---

  it('should commit [7/09..7/18] (연속 10일) when start(7/09, 미선택) then enter(7/18) then commit (select 페인트)', () => {
    const { result } = renderHook(() => useDragSelect({ value: [] }));

    let out: Date[] = [];
    act(() => result.current.start(d(9)));
    act(() => result.current.enter(d(18)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual(range(9, 18));
  });

  it('should commit [7/09,7/10,7/11,7/16,7/17,7/18] when start(7/12, 선택) then enter(7/15) then commit given value=[7/09..7/18] (deselect 페인트)', () => {
    const value = range(9, 18).map(d);
    const { result } = renderHook(() => useDragSelect({ value }));

    let out: Date[] = [];
    act(() => result.current.start(d(12)));
    act(() => result.current.enter(d(15)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual([9, 10, 11, 16, 17, 18]);
  });

  it('should set isDragging=true after start and false after commit', () => {
    const { result } = renderHook(() => useDragSelect({ value: [] }));

    act(() => result.current.start(d(9)));
    expect(result.current.isDragging).toBe(true);

    act(() => result.current.enter(d(11)));
    act(() => {
      result.current.commit();
    });
    expect(result.current.isDragging).toBe(false);
  });

  it('should expose previewValue=[7/09..7/13] during active drag before commit given value=[]', () => {
    const { result } = renderHook(() => useDragSelect({ value: [] }));

    act(() => result.current.start(d(9)));
    act(() => result.current.enter(d(13)));

    expect(days(result.current.previewValue)).toEqual(range(9, 13));
  });

  // --- 경계 ---

  it('should commit [7/09..7/18] regardless of direction when start(7/18) then enter(7/09) then commit (역방향, min~max)', () => {
    const { result } = renderHook(() => useDragSelect({ value: [] }));

    let out: Date[] = [];
    act(() => result.current.start(d(18)));
    act(() => result.current.enter(d(9)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual(range(9, 18));
  });

  it('should paint only [7/15] when start(7/15, 미선택) then enter(7/15) then commit (단일 셀 드래그 = 탭)', () => {
    const { result } = renderHook(() => useDragSelect({ value: [] }));

    let out: Date[] = [];
    act(() => result.current.start(d(15)));
    act(() => result.current.enter(d(15)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual([15]);
  });

  it('should union without duplicate when select-painting over already-selected day: value=[7/15], start(7/13) then enter(7/17)', () => {
    const { result } = renderHook(() => useDragSelect({ value: [d(15)] }));

    let out: Date[] = [];
    act(() => result.current.start(d(13)));
    act(() => result.current.enter(d(17)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual([13, 14, 15, 16, 17]);
  });

  it('should return a new array instance (not the same ref as value) from commit', () => {
    const value: Date[] = [];
    const { result } = renderHook(() => useDragSelect({ value }));

    let out: Date[] = [];
    act(() => result.current.start(d(9)));
    act(() => result.current.enter(d(10)));
    act(() => {
      out = result.current.commit();
    });

    expect(out).not.toBe(value);
  });

  // --- 예외 ---

  it('should skip disabled 7/08,7/09 and commit [7/10,7/11,7/12] when start(7/08) then enter(7/12) given isDateDisabled=d<7/10', () => {
    const { result } = renderHook(() =>
      useDragSelect({ value: [], isDateDisabled: (x) => x < d(10) })
    );

    let out: Date[] = [];
    act(() => result.current.start(d(8)));
    act(() => result.current.enter(d(12)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual([10, 11, 12]);
  });

  it('should keep paint mode fixed to select (anchor unselected) so an already-selected cell in range stays selected', () => {
    const { result } = renderHook(() => useDragSelect({ value: [d(15)] }));

    let out: Date[] = [];
    act(() => result.current.start(d(13)));
    act(() => result.current.enter(d(17)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toContain(15);
  });

  it('should reset (isDragging=false, previewValue back to value) without a commit when cancel() is called mid-drag', () => {
    const { result } = renderHook(() => useDragSelect({ value: [d(15)] }));

    act(() => result.current.start(d(9)));
    act(() => result.current.enter(d(13)));
    expect(result.current.isDragging).toBe(true);

    act(() => result.current.cancel());

    expect(result.current.isDragging).toBe(false);
    expect(days(result.current.previewValue)).toEqual([15]);
  });

  // --- Issue 3: 개수 제한(anchor부터 채우고 자르기) ---

  it('should fill forward to [7/01..7/21] (21개) when anchor 7/01 then enter 7/25 then commit, maxSelectedDays=21', () => {
    const { result } = renderHook(() => useDragSelect({ value: [], maxSelectedDays: 21 }));

    let out: Date[] = [];
    act(() => result.current.start(d(1)));
    act(() => result.current.enter(d(25)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual(range(1, 21));
  });

  it('should fill reverse to [7/05..7/25] (21개) keeping anchor 7/25 when anchor 7/25 then enter 7/01 then commit, maxSelectedDays=21', () => {
    const { result } = renderHook(() => useDragSelect({ value: [], maxSelectedDays: 21 }));

    let out: Date[] = [];
    act(() => result.current.start(d(25)));
    act(() => result.current.enter(d(1)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual(range(5, 25));
  });

  it('should call onLimitExceeded exactly once when a drag commit is clamped', () => {
    const onLimitExceeded = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect({ value: [], maxSelectedDays: 21, onLimitExceeded })
    );

    act(() => result.current.start(d(1)));
    act(() => result.current.enter(d(25)));
    act(() => {
      result.current.commit();
    });

    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
  });

  it('should keep full [7/01..7/21] and not call onLimitExceeded when count is exactly 21', () => {
    const onLimitExceeded = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect({ value: [], maxSelectedDays: 21, onLimitExceeded })
    );

    let out: Date[] = [];
    act(() => result.current.start(d(1)));
    act(() => result.current.enter(d(21)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual(range(1, 21));
    expect(onLimitExceeded).not.toHaveBeenCalled();
  });

  it('should not clamp (unlimited) and not call onLimitExceeded when maxSelectedDays is undefined', () => {
    const onLimitExceeded = vi.fn();
    const { result } = renderHook(() => useDragSelect({ value: [], onLimitExceeded }));

    let out: Date[] = [];
    act(() => result.current.start(d(1)));
    act(() => result.current.enter(d(31)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual(range(1, 31));
    expect(onLimitExceeded).not.toHaveBeenCalled();
  });

  it('should consume existing selection budget to [7/01, 7/05..7/24] with onLimitExceeded once when value=[7/01] then anchor 7/05 enter 7/25 commit, maxSelectedDays=21', () => {
    const onLimitExceeded = vi.fn();
    const { result } = renderHook(() =>
      useDragSelect({ value: [d(1)], maxSelectedDays: 21, onLimitExceeded })
    );

    let out: Date[] = [];
    act(() => result.current.start(d(5)));
    act(() => result.current.enter(d(25)));
    act(() => {
      out = result.current.commit();
    });

    expect(days(out)).toEqual([1, ...range(5, 24)]);
    expect(onLimitExceeded).toHaveBeenCalledTimes(1);
  });
});
