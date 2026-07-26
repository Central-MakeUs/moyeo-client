import type { AuthUserResponse } from '@/shared/api';

// 현재 세션 상태 (useSessionState가 판정한다).
export type SessionState =
  | { status: 'no-token' } // 저장된 토큰 없음
  | { status: 'unauthorized' } // 토큰은 있으나 me() 401 (만료/무효)
  | { status: 'authenticated'; user: AuthUserResponse }; // 토큰 유효

interface RequiredRoute {
  path: string;
  clearSession: boolean; // true면 소비처가 clearToken() (저장된 죽은 토큰 삭제)
}

export type GuardAccess =
  | { status: 'allow' }
  | { status: 'redirect'; path: string; clearSession: boolean };

// 세션 상태에 따라 유저를 보내야 할 경로. null이면 보낼 곳 없음(온보딩 완료 → 어디든 OK).
// - 미인증(토큰 없음/만료) → /login (만료면 죽은 토큰 삭제)
// - 미온보딩              → /nickname
// - 온보딩 완료           → null
function resolveRequiredRoute(state: SessionState): RequiredRoute | null {
  switch (state.status) {
    case 'no-token':
      return { path: '/login', clearSession: false };
    case 'unauthorized': // 만료/무효 토큰 → 삭제
      return { path: '/login', clearSession: true };
    case 'authenticated':
      return state.user.onboardingCompleted ? null : { path: '/nickname', clearSession: false };
  }
}

// 보호 라우트(pathname) 접근 가부.
// 보낼 곳이 없거나(자유) 이미 그 경로면 통과, 아니면 그곳으로 리다이렉트.
export function resolveGuardAccess(state: SessionState, pathname: string): GuardAccess {
  const required = resolveRequiredRoute(state);
  if (required === null || required.path === pathname) {
    return { status: 'allow' };
  }
  return { status: 'redirect', ...required };
}
