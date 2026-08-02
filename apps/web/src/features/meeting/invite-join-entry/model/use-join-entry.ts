'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useSession } from '@/entities/session';
import { getInvitation } from '@/shared/api';
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
  /**
   * 참여하기 탭 핸들러.
   *
   * 로그인한 사용자는 토큰 실은 조회로 이미 참여했는지 확인한 뒤 목적지를 정하므로 비동기다.
   */
  participate: () => Promise<void>;
  /** 로그인 없이 일회성 게스트 신원 입력 화면으로 이동한다. */
  participateAsGuest: () => void;
  /** Drawer 열림 상태 변경 요청(오버레이 탭·드래그). */
  setDrawerOpen: (next: boolean) => void;
  /**
   * 세션을 불러오지 못해 참여할 수 없을 때의 재시도. 그 외 상태에서는 `null`이다.
   * 호출부는 이 값이 있을 때만 오류 안내를 노출한다.
   */
  retrySession: (() => void) | null;
  /**
   * 로그인 왕복 후 돌아올 경로. 초대 화면 자신이다.
   *
   * `/i/{code}/nickname`이 아니다 — 로그인하는 사이 마감되거나 정원이 찰 수 있어
   * 참여 가능 상태를 다시 통과해야 한다(prd.md ADR-4).
   */
  loginNextPath: string;
}

/**
 * 로그인한 사용자의 실제 목적지를 확인한다.
 *
 * 이미 참여한 모임이면 현황 화면 경로를, 그대로 진행해도 되면 `fallbackPath`를 돌려준다.
 * 그새 마감되거나 정원이 찼으면 `null`을 돌려 이동을 막는다.
 *
 * 조회에 실패하면 `fallbackPath`로 보낸다. 확인은 편의일 뿐이고 최종 방어선은 서버의 참여
 * 제출 거절이다. 확인이 안 된다고 참여 자체를 막지 않는다.
 */
async function resolveCheckedPath(
  inviteCode: string,
  fallbackPath: string
): Promise<string | null> {
  try {
    const invitation = await getInvitation(inviteCode);
    const status = invitation.participationStatus;

    // 상태가 없는 성공 응답도 참여 여부를 확인하지 못한 경우다. 네트워크 실패와 동일하게
    // 기존 경로로 진행하고, 최종 참여 가능 여부는 참여 제출 API가 판단한다.
    if (!status) return fallbackPath;

    const checked = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: status.canJoin === true,
      inviteCode,
      reason: status.reason,
    });

    if (checked.type === 'blocked') return null;
    if (checked.type === 'view') return checked.path;

    return fallbackPath;
  } catch {
    return fallbackPath;
  }
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
  const [isChecking, setChecking] = React.useState(false);
  const isCheckingRef = React.useRef(false);

  const destination = resolveJoinDestination({
    sessionStatus: session.status,
    canJoin,
    inviteCode,
  });

  const participate = async () => {
    if (destination.type === 'blocked') return;

    if (destination.type === 'login-drawer') {
      setDrawerOpen(true);
      return;
    }

    // 상태 반영 전의 빠른 연속 탭도 막아 인증 조회와 화면 이동을 한 번만 실행한다.
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setChecking(true);

    // 여기부터는 authenticated다. 진입 조회는 서버 컴포넌트의 네이티브 fetch라 토큰이 없어
    // ALREADY_JOINED를 담을 수 없다. 토큰이 실리는 클라이언트 조회로 한 번 더 확인한다(#161).
    try {
      const checkedPath = await resolveCheckedPath(inviteCode, destination.path);
      if (checkedPath === null) return;

      router.push(checkedPath);
    } finally {
      isCheckingRef.current = false;
      setChecking(false);
    }
  };

  return {
    isBlocked: destination.type === 'blocked' || isChecking,
    isDrawerOpen,
    // 앱 WebView 안에서는 게스트 참여를 제공하지 않는다(prd.md ADR-5).
    drawerType: isNativeContext() ? 'member' : 'guest',
    participate,
    participateAsGuest: () => router.push(`/i/${inviteCode}/guest`),
    setDrawerOpen,
    // 세션 오류는 기다린다고 낫지 않는다. 사용자가 직접 다시 시도할 수단을 준다
    // (spec-fixed.md §4-3).
    retrySession: session.status === 'error' ? session.retry : null,
    loginNextPath: `/i/${inviteCode}`,
  };
}
