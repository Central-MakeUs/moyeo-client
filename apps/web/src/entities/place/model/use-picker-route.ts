'use client';

import * as React from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * 위치 확인 화면(`?picker=current`)의 열림 상태는 URL이 소유한다.
 *
 * 컴포넌트 state로 두면 iOS 엣지 스와이프가 브리지를 우회해 히스토리를 직접 되감아
 * 지도 화면을 건너뛰고 검색까지 함께 닫힌다 (`spec-fixed.md` §4-2).
 */
export const PICKER_QUERY_KEY = 'picker';
export const PICKER_VALUE_CURRENT = 'current';

export interface PickerRoute {
  /** 현재 URL에 `?picker=current` 가 있는가. */
  isPickerOpen: boolean;
  /** 쿼리를 `push` 해서 연다. 히스토리가 한 칸 쌓인다. */
  openPicker: () => void;
  /**
   * 닫는다.
   *
   * - 이 훅이 `push` 로 열었으면 `router.back()`
   * - `?picker=current` 로 직접 진입했으면 `router.replace(검색 URL)` (`spec-fixed.md` §4-5)
   */
  closePicker: () => void;
}

export function usePickerRoute(): PickerRoute {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * 이 훅이 직접 열었는가.
   *
   * 직접 진입·새로고침은 되감을 항목이 없어 `back()` 이 검색 화면을 지나쳐 버린다.
   * 그래서 "내가 쌓은 항목이 있을 때만" 되감는다.
   */
  const hasPushedRef = React.useRef(false);

  const isPickerOpen = searchParams.get(PICKER_QUERY_KEY) === PICKER_VALUE_CURRENT;

  const openPicker = () => {
    const next = new URLSearchParams(searchParams);
    next.set(PICKER_QUERY_KEY, PICKER_VALUE_CURRENT);

    hasPushedRef.current = true;
    router.push(`${pathname}?${next.toString()}`);
  };

  const closePicker = () => {
    // openPicker 로 연 경우
    if (hasPushedRef.current) {
      hasPushedRef.current = false;
      router.back();
      return;
    }

    // picker URL로 직접 진입한 경우
    const next = new URLSearchParams(searchParams);
    next.delete(PICKER_QUERY_KEY);

    const query = next.toString();
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname);
  };

  return { isPickerOpen, openPicker, closePicker };
}
