import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import type { DepartureDraft } from './departure-draft';
import {
  useDeferredPickerSelection,
  type DeferredPickerSelection,
  type UseDeferredPickerSelectionParams,
} from './use-deferred-picker-selection';

const closePicker = vi.fn();
const onSelect = vi.fn();

const SEOUL_CITY_HALL: DepartureDraft = {
  name: '서울특별시 중구 세종대로 110',
  address: '서울특별시 중구 세종대로 110',
  latitude: 37.57,
  longitude: 126.98,
};

const GANGNAM_STATION: DepartureDraft = {
  name: '서울특별시 강남구 강남대로 396',
  address: '서울특별시 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

/** picker가 열려 있는 상태에서 시작한다. 닫힘은 rerender로 반영한다. */
const renderDeferredSelection = (isPickerOpen = true) =>
  renderHook<DeferredPickerSelection, UseDeferredPickerSelectionParams>(
    (props) => useDeferredPickerSelection(props),
    { initialProps: { isPickerOpen, closePicker, onSelect } }
  );

/** 닫힘이 URL에 반영된 상태를 만든다. */
const closeUrl = (rerender: (props: UseDeferredPickerSelectionParams) => void) => {
  rerender({ isPickerOpen: false, closePicker, onSelect });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDeferredPickerSelection', () => {
  it('isPickerOpen이 true일 때 confirmSelection(draft)를 호출하면 closePicker가 1회 호출되고 onSelect는 아직 호출되지 않는다', () => {
    const { result } = renderDeferredSelection();

    act(() => result.current.confirmSelection(SEOUL_CITY_HALL));

    expect(closePicker).toHaveBeenCalledTimes(1);
    // 같은 tick에 연속으로 태우면 안 된다 (spec-fixed.md §4-4).
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('confirmSelection 후 isPickerOpen이 false로 바뀌면 보관한 draft로 onSelect가 정확히 1회 호출된다', () => {
    const { result, rerender } = renderDeferredSelection();

    act(() => result.current.confirmSelection(SEOUL_CITY_HALL));
    act(() => closeUrl(rerender));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SEOUL_CITY_HALL);
  });

  it('URL이 닫히기 전에 confirmSelection을 연속 2회 호출해도 closePicker는 1회만 호출되고 onSelect는 첫 번째 draft로 1회만 호출된다', () => {
    const { result, rerender } = renderDeferredSelection();

    act(() => {
      result.current.confirmSelection(SEOUL_CITY_HALL);
      result.current.confirmSelection(GANGNAM_STATION);
    });

    expect(closePicker).toHaveBeenCalledTimes(1);

    act(() => closeUrl(rerender));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SEOUL_CITY_HALL);
  });

  it('onSelect가 호출된 뒤 isPickerOpen이 false인 채로 여러 번 rerender해도 onSelect 호출 횟수는 1회로 유지된다', () => {
    const { result, rerender } = renderDeferredSelection();

    act(() => result.current.confirmSelection(SEOUL_CITY_HALL));
    act(() => closeUrl(rerender));
    act(() => closeUrl(rerender));
    act(() => closeUrl(rerender));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('confirmSelection 없이 isPickerOpen이 true에서 false로 바뀌면 onSelect가 호출되지 않는다', () => {
    const { rerender } = renderDeferredSelection();

    act(() => closeUrl(rerender));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('confirmSelection 후 isPickerOpen이 false가 되기 전에 언마운트되면 onSelect가 호출되지 않는다', () => {
    const { result, unmount } = renderDeferredSelection();

    act(() => result.current.confirmSelection(SEOUL_CITY_HALL));
    act(() => unmount());

    // 보관 값은 훅 인스턴스가 소유한다. cleanup에서 전달하지 않는다.
    expect(onSelect).not.toHaveBeenCalled();
  });
});
