'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

/** 되감을 기록이 없을 때 열어 줄 현황 탭. */
export type OverviewTab = 'schedule' | 'place';

/**
 * 수정 화면을 닫고 현황으로 돌아간다. 뒤로가기와 저장 완료가 함께 쓴다.
 *
 * **되감는다.** 수정 화면은 현황에서 눌러 들어오므로 현황이 바로 앞 기록이다. 여기서
 * `push`나 `replace`로 현황을 새로 열면 기록에 현황이 하나 더 쌓여, 기기 뒤로가기가 다시
 * 수정 화면으로 들어가거나 같은 현황을 두 번 지나게 된다.
 *
 * 되감으면 떠날 때의 주소로 그대로 돌아가므로 보던 탭도 함께 복원된다(`useCoordinationTab`).
 *
 * 되감을 곳이 없을 때만 현황을 새로 연다 — 링크로 이 화면에 곧장 들어온 경우다. 이때는
 * 돌아갈 탭을 알 수 없으니 수정하던 대상에 맞는 탭을 지정해서 연다.
 */
export function useCloseEditScreen(inviteCode: string, tab: OverviewTab): () => void {
  const router = useRouter();

  return React.useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(`/meetings?code=${inviteCode}&tab=${tab}`);
  }, [router, inviteCode, tab]);
}
