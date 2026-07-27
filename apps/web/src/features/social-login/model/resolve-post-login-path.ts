import { resolveNextPath } from '@/entities/session';
import type { AuthUserResponse } from '@/shared/api';

const ONBOARDING_PATH = '/nickname';

/**
 * 소셜 로그인 성공 후 이동할 경로.
 *
 * 온보딩이 남았으면 그쪽이 우선이고, 끝났으면 로그인 화면에 실려온 `?next=`로 돌아간다.
 * 초대 링크(`/i/[inviteToken]`)로 들어온 사용자가 로그인 때문에 목적지를 잃지 않게 하기 위함이며,
 * 외부 주소로 튕기는 open redirect는 `resolveNextPath`가 막는다.
 *
 * dev 로그인(`useDevAuth`)도 같은 규칙을 쓰므로 로그인 경로가 갈라지지 않는다.
 */
export function resolvePostLoginPath(
  user: AuthUserResponse | undefined,
  next?: string | null
): string {
  if (!user?.onboardingCompleted) return ONBOARDING_PATH;

  return resolveNextPath(next);
}
