'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useSession } from '@/entities/session';
import { isNativeContext } from '@/shared/model';

import { resolveJoinDestination } from './resolve-join-destination';

export interface UseJoinEntryParams {
  /** 경로의 초대 코드. */
  inviteCode: string;
  /** 서버가 계산한 참여 가능 여부. */
  canJoin: boolean;
}

export interface UseJoinEntryReturn {
  /** 참여하기를 누를 수 없는 상태. 버튼 `disabled`에 그대로 쓴다. */
  isBlocked: boolean;
  /** 로그인 Drawer 열림 상태. */
  isDrawerOpen: boolean;
  /** 로그인 Drawer 구성(prd.md ADR-5). WebView 안이면 `member`. */
  drawerType: 'guest' | 'member';
  /** 참여하기 탭 핸들러. */
  participate: () => void;
  /** Drawer 열림 상태 변경 요청(오버레이 탭·드래그). */
  setDrawerOpen: (next: boolean) => void;
  /**
   * 세션을 불러오지 못해 참여할 수 없을 때의 재시도. 그 외 상태에서는 `null`이다.
   * 호출부는 이 값이 있을 때만 오류 안내를 노출한다.
   */
  retrySession: (() => void) | null;
}

/**
 * 참여하기 입구의 분기와 로그인 Drawer 상태를 소유한다.
 *
 * 실제 참여 제출(`joinMember`/`joinGuest`)은 다루지 않는다.
 */
export function useJoinEntry({ inviteCode, canJoin }: UseJoinEntryParams): UseJoinEntryReturn {
  const session = useSession();
  const router = useRouter();
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);

  const destination = resolveJoinDestination({
    sessionStatus: session.status,
    canJoin,
    inviteCode,
  });

  const participate = () => {
    if (destination.type === 'blocked') return;

    if (destination.type === 'login-drawer') {
      setDrawerOpen(true);
      return;
    }

    router.push(destination.path);
  };

  return {
    isBlocked: destination.type === 'blocked',
    isDrawerOpen,
    // 앱 WebView 안에서는 게스트 참여를 제공하지 않는다(prd.md ADR-5).
    drawerType: isNativeContext() ? 'member' : 'guest',
    participate,
    setDrawerOpen,
    // 세션 오류는 기다린다고 낫지 않는다. 사용자가 직접 다시 시도할 수단을 준다
    // (spec-fixed.md §4-3).
    retrySession: session.status === 'error' ? session.retry : null,
  };
}
