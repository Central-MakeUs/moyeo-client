'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** 조율 현황 탭. 값이 그대로 URL에 들어간다. */
export type CoordinationTab = 'schedule' | 'place';

const TAB_PARAM = 'tab';
const DEFAULT_TAB: CoordinationTab = 'schedule';

export interface CoordinationTabState {
  tab: CoordinationTab;
  selectTab: (next: string) => void;
}

/**
 * 어느 조율 탭을 보고 있는지를 URL에 담는다.
 *
 * 컴포넌트 상태로 들면 응답 수정을 다녀왔을 때 항상 일정 탭으로 돌아간다. 위치를 고치고
 * 왔는데 일정 탭이 열리는 셈이다. URL에 있으면 **뒤로가기가 탭까지 복원한다** — 수정 화면은
 * 되감아서 나오므로(`useCloseEditScreen`) 떠날 때의 주소로 그대로 돌아온다.
 *
 * 탭을 바꿀 때는 `replace`를 쓴다. `push`면 탭을 누를 때마다 기록이 쌓여, 뒤로가기가 화면을
 * 벗어나지 못하고 탭만 되짚는다.
 */
export function useCoordinationTab(): CoordinationTabState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab: CoordinationTab = searchParams.get(TAB_PARAM) === 'place' ? 'place' : DEFAULT_TAB;

  const selectTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);

    // 탭 전환으로 스크롤이 맨 위로 튀지 않게 한다.
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return { tab, selectTab };
}
