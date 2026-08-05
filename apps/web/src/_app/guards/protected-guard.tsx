'use client';

import { useEffect, useRef } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { buildLoginPath, NEXT_PARAM, toSafeNextPath, useSession } from '@/entities/session';

import { AppSplash, SessionErrorScreen } from './session-fallback';

const ONBOARDING_PATH = '/nickname';

/** 온보딩을 마쳤는데 돌아갈 곳이 지정되지 않았을 때. 온보딩 폼의 기본값과 같아야 한다. */
const DEFAULT_ONBOARDED_PATH = '/home';

/**
 * 계정 세션이 필요한 화면의 가드.
 *
 * dev 로그인과 소셜 로그인이 같은 세션 계약을 쓰므로 가드는 이것 하나뿐이다.
 * 리다이렉트 중에도 스플래시를 렌더해 빈 화면을 만들지 않는다.
 */
export function ProtectedGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 로그아웃·탈퇴로 익명이 된 경우를 "로그인이 필요해 막힌 경우"와 구분하기 위한 표시.
  const hasBeenAuthenticatedRef = useRef(false);

  const needsOnboarding =
    session.status === 'authenticated' &&
    !session.viewer.onboardingCompleted &&
    pathname !== ONBOARDING_PATH;

  const shouldLeaveOnboarding =
    session.status === 'authenticated' &&
    session.viewer.onboardingCompleted &&
    pathname === ONBOARDING_PATH;

  useEffect(() => {
    if (session.status === 'authenticated') hasBeenAuthenticatedRef.current = true;
  }, [session.status]);

  useEffect(() => {
    if (session.status === 'anonymous') {
      // 로그인 상태였다가 익명이 됐다 = 로그아웃 또는 탈퇴. 방금 떠난 화면을 `next`로
      // 남기면 재로그인 직후 그리로 되돌아간다(탈퇴한 계정의 탈퇴 화면 등). 남기지 않는다.
      if (hasBeenAuthenticatedRef.current) {
        router.replace(buildLoginPath(null));
        return;
      }

      // 초대 링크로 들어온 사용자가 로그인 후 목적지를 잃지 않도록 현재 위치를 보존한다.
      const from = `${window.location.pathname}${window.location.search}`;
      router.replace(buildLoginPath(from));
      return;
    }

    // TODO: 온보딩에서도 next 경로를 저장할지 고민
    if (needsOnboarding) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    // 최초 등록 전용 화면이므로 온보딩을 마친 사용자는 내보낸다.
    //
    // 목적지를 `/home`으로 고정하면 안 된다. 온보딩을 방금 끝낸 순간에도 이 조건이 참이 되는데,
    // 그때 온보딩 폼은 이미 `?next=`로 이동을 시작한 상태다. 두 replace가 경합해 이쪽이 이기면
    // 초대 링크로 들어온 신규 가입자가 초대장 대신 홈으로 떨어진다. 같은 값을 보게 해서
    // 어느 쪽이 이기든 결과가 같게 한다(prd.md ADR-4).
    if (shouldLeaveOnboarding) {
      const next = new URLSearchParams(window.location.search).get(NEXT_PARAM);
      router.replace(toSafeNextPath(next) ?? DEFAULT_ONBOARDED_PATH);
    }
  }, [session.status, needsOnboarding, shouldLeaveOnboarding, router]);

  if (session.status === 'error') {
    return <SessionErrorScreen onRetry={session.retry} />;
  }

  // 세션 복원 중이거나 리다이렉트 전 잠깐 렌더링되는 대기 화면
  if (session.status !== 'authenticated' || needsOnboarding || shouldLeaveOnboarding) {
    return <AppSplash />;
  }

  return <>{children}</>;
}
