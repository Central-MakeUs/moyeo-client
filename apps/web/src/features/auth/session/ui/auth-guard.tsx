'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { clearToken } from '@/shared/api';

import { resolveGuardAccess } from '../model/session-routing';
import { useSessionState } from '../model/use-session-state';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const state = useSessionState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const access = state ? resolveGuardAccess(state, pathname) : null;
  const redirectPath = access?.status === 'redirect' ? access.path : null;
  const shouldClear = access?.status === 'redirect' ? access.clearSession : false;

  useEffect(() => {
    if (!mounted || redirectPath === null) return;
    if (shouldClear) clearToken();
    router.replace(redirectPath);
  }, [mounted, redirectPath, shouldClear, router]);

  // 서버·마운트 전·판정 중·리다이렉트 대상이면 로딩. allow일 때만 children 통과.
  const allowed = mounted && access?.status === 'allow';
  if (!allowed) {
    // TODO(디자인): 텍스트 대신 스피너
    return <main>로그인 확인 중...</main>;
  }
  return <>{children}</>;
}
