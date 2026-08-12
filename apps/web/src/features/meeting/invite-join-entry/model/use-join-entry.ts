'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { isExplainedBlockReason } from '@/entities/meeting';
import { useSession } from '@/entities/session';
import { type ParticipationStatusResponse } from '@/shared/api';
import { isKakaoInAppBrowser, isNativeContext, openAppLink } from '@/shared/model';

import { checkJoinDestination } from './check-join-destination';
import {
  isSessionUnresolved,
  joinEntryPath,
  resolveJoinDestination,
} from './resolve-join-destination';

export interface UseJoinEntryParams {
  inviteCode: string;
  participationStatus?: ParticipationStatusResponse | null;
}

/** 참여하기 버튼에 그대로 사용되는 상태 */
export interface JoinButtonState {
  /**
   * 세션을 읽지 못했거나, 막혔는데 서버가 사유를 주지 않은 경우
   * **사유를 아는 차단인 경우 비활성화되지 않는다.
   */
  isDisabled: boolean;
  /** 탭한 뒤 목적지를 확인하는 중 */
  isLoading: boolean;
  /**
   * 로그인한 사용자는 토큰 실은 조회로 이미 참여했는지 확인한 뒤 목적지를 정하므로 비동기이다.
   */
  onTap: () => Promise<void>;
}

/** 로그인 Drawer에 사용되는 상태 */
export interface LoginDrawerState {
  isOpen: boolean;
  /** 제공할 로그인 수단 - 앱 WebView 안이면 `member` */
  type: 'guest' | 'member';
  /**
   * 로그인 왕복 후 돌아올 경로 - 초대 화면 경로
   *
   * `/i/{code}/nickname`이 아니다 — 로그인하는 사이 마감되거나 정원이 찰 수 있어
   * 참여 가능 상태를 다시 통과하도록 한다. TODO: 로그인 뿐아니라 폼 다 제출하고서도 발생할 수 있는 문제인데, 그냥 /nickname으로 가도록 하는 건 어떤지?
   */
  next: string;
  /** 열림 상태 변경 요청(오버레이 탭/드래그) */
  onOpenChange: (open: boolean) => void;
  /** 로그인 없이 일회성 게스트 신원 입력 화면으로 이동 */
  onGuestJoin: () => void;
}

/** 차단 안내 - `status`가 `null`이면 닫힌 상태 */
export interface BlockedNoticeState {
  /**
   * 참여를 막은 서버 상태.
   *
   * 참여하기를 탭했을 때만 채워진다. 진입 시점에 이미 막혀 있던 경우와, 로그인하는 사이
   * 마감·정원이 바뀐 경우를 함께 담는다.
   */
  status: ParticipationStatusResponse | null;
  clear: () => void;
}

export interface UseJoinEntryReturn {
  joinButton: JoinButtonState;
  loginDrawer: LoginDrawerState;
  blocked: BlockedNoticeState;
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
export function useJoinEntry({
  inviteCode,
  participationStatus,
}: UseJoinEntryParams): UseJoinEntryReturn {
  const session = useSession();
  const router = useRouter();

  const [isDrawerOpen, setDrawerOpen] = React.useState(false);
  const [isChecking, setChecking] = React.useState(false);
  const [blockedStatus, setBlockedStatus] = React.useState<ParticipationStatusResponse | null>(
    null
  );
  const isCheckingRef = React.useRef(false);

  // 필드가 없으면 참여 가능으로 추측하지 않는다.
  const canJoin = participationStatus?.canJoin === true;

  // 설명할 수 없는 사유로 안내를 띄우면 막혔다는 뜻이 전달되지 않는다. 그때는 안내 대신 잠근다.
  const canExplainBlock = isExplainedBlockReason(participationStatus?.reason);
  const isBlockedWithoutExplanation = !canJoin && !canExplainBlock;

  const destination = resolveJoinDestination({
    sessionStatus: session.status,
    canJoin,
    inviteCode,
  });

  /**
   * 참여하기를 탭한 결과로만 안내를 연다.
   */
  const continueParticipation = async () => {
    // `participate`에서 이미 걸렀지만, 이 함수만 봐도 안전하도록 한 번 확인
    if (isSessionUnresolved(destination)) return;

    if (destination.type === 'login-drawer') {
      setDrawerOpen(true);
      return;
    }

    // 상태 반영 전의 빠른 연속 탭도 막아 인증 조회와 화면 이동을 한 번만 실행한다.
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setChecking(true);

    try {
      // authenticated 참여자의 경우
      // 이미 참여한 사용자(모임장 포함)는 마감·정원과 무관하게 자기 모임으로
      // 가야 하는데, 토큰 없는 응답에는 `DEADLINE_PASSED`로 되어있음
      const checked = await checkJoinDestination(inviteCode, joinEntryPath(inviteCode));

      if (checked.type === 'blocked') {
        setBlockedStatus(checked.status);
        return;
      }

      // 모임이 사라졌다. 지금 화면이 곧 초대 화면이라, 다시 렌더시키면 서버가 `notFound()`로
      // 넘겨 초대 404 화면이 뜬다. 여기서 직접 경로를 정하지 않는 이유는 그 판단이 이미
      // 초대 페이지에 있기 때문이다.
      if (checked.type === 'not-found') {
        router.refresh();
        return;
      }

      router.push(checked.path);
    } finally {
      isCheckingRef.current = false;
      setChecking(false);
    }
  };

  const participate = async () => {
    // 세션을 모르는 동안은 앱을 실행하지 않음
    if (isSessionUnresolved(destination)) return;

    // 카카오톡 인앱 브라우저인 경우 커스텀 스킴을 사용해 앱을 실행한다.
    // 앱이 없으면 브라우저에서 계속 진행
    if (!isNativeContext() && isKakaoInAppBrowser()) {
      setChecking(true);

      openAppLink(`/i/${inviteCode}`, {
        onUnavailable: () => {
          setChecking(false);
          void continueParticipation();
        },
      });
      return;
    }

    await continueParticipation();
  };

  return {
    joinButton: {
      isDisabled: isSessionUnresolved(destination) || isBlockedWithoutExplanation,
      isLoading: isChecking,
      onTap: participate,
    },
    loginDrawer: {
      isOpen: isDrawerOpen,
      type: isNativeContext() ? 'member' : 'guest',
      next: `/i/${inviteCode}`,
      onOpenChange: setDrawerOpen,
      onGuestJoin: () => router.push(`/i/${inviteCode}/guest`),
    },
    blocked: {
      status: blockedStatus,
      clear: () => setBlockedStatus(null),
    },
    retrySession: session.status === 'error' ? session.retry : null,
  };
}
