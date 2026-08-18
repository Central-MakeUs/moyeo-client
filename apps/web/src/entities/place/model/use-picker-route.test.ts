import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { usePickerRoute } from './use-picker-route';

const { push, back, replace, navigation } = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  navigation: {
    pathname: '/meetings/new/departure/search',
    searchParams: new URLSearchParams(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, back, replace }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
}));

const SEARCH_PATH = '/meetings/new/departure/search';

beforeEach(() => {
  vi.clearAllMocks();
  navigation.pathname = SEARCH_PATH;
  navigation.searchParams = new URLSearchParams();
});

describe('usePickerRoute', () => {
  it('URL에 picker 쿼리가 없으면 isPickerOpen이 false다', () => {
    const { result } = renderHook(() => usePickerRoute());

    expect(result.current.isPickerOpen).toBe(false);
  });

  it('URL이 ?picker=current면 isPickerOpen이 true다', () => {
    navigation.searchParams = new URLSearchParams('picker=current');

    const { result } = renderHook(() => usePickerRoute());

    expect(result.current.isPickerOpen).toBe(true);
  });

  it('openPicker()를 부르면 router.push가 /meetings/new/departure/search?picker=current로 1회 호출된다', () => {
    const { result } = renderHook(() => usePickerRoute());

    act(() => result.current.openPicker());

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(`${SEARCH_PATH}?picker=current`);
  });

  it('openPicker()로 연 뒤 closePicker()를 부르면 router.back이 1회 호출되고 router.replace는 호출되지 않는다', () => {
    const { result } = renderHook(() => usePickerRoute());

    act(() => result.current.openPicker());
    act(() => result.current.closePicker());

    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('?picker=current로 직접 진입한 상태에서 closePicker()를 부르면 router.replace가 /meetings/new/departure/search로 호출되고 router.back은 호출되지 않는다', () => {
    navigation.searchParams = new URLSearchParams('picker=current');
    const { result } = renderHook(() => usePickerRoute());

    act(() => result.current.closePicker());

    expect(replace).toHaveBeenCalledWith(SEARCH_PATH);
    expect(back).not.toHaveBeenCalled();
  });

  it('?picker=other처럼 값이 current가 아니면 isPickerOpen이 false다', () => {
    navigation.searchParams = new URLSearchParams('picker=other');

    const { result } = renderHook(() => usePickerRoute());

    expect(result.current.isPickerOpen).toBe(false);
  });

  it('?q=강남이 있을 때 openPicker()를 부르면 기존 쿼리가 보존된 채 picker만 추가된다', () => {
    navigation.searchParams = new URLSearchParams('q=강남');
    const { result } = renderHook(() => usePickerRoute());

    act(() => result.current.openPicker());

    const [pushedUrl] = push.mock.calls[0] as [string];
    const pushedQuery = new URLSearchParams(pushedUrl.split('?')[1]);

    expect(pushedQuery.get('q')).toBe('강남');
    expect(pushedQuery.get('picker')).toBe('current');
  });
});
