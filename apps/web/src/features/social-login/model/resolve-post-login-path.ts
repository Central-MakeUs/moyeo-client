import { NEXT_PARAM, resolveNextPath, toSafeNextPath } from '@/entities/session';
import type { AuthUserResponse } from '@/shared/api';

const ONBOARDING_PATH = '/nickname';

/**
 * 소셜 로그인 성공 후 이동할 경로.
 *
 * 온보딩이 남았으면 그쪽이 우선이지만 `next`를 버리지 않고 실어 보낸다. 초대 링크로 들어온
 * 신규 가입자가 온보딩을 마치면 초대장을 잃던 문제를 막기 위함이다(prd.md ADR-4).
 * 온보딩이 끝났으면 로그인 화면에 실려온 `?next=`로 바로 돌아간다.
 *
 * 외부 주소로 튕기는 open redirect는 `toSafeNextPath`·`resolveNextPath`가 막는다.
 * dev 로그인(`useDevAuth`)도 같은 규칙을 쓰므로 로그인 경로가 갈라지지 않는다.
 */
export function resolvePostLoginPath(
  user: AuthUserResponse | undefined,
  next?: string | null
): string {
  if (!user?.onboardingCompleted) {
    const safeNext = toSafeNextPath(next);
    if (!safeNext) return ONBOARDING_PATH;

    return `${ONBOARDING_PATH}?${NEXT_PARAM}=${encodeURIComponent(safeNext)}`;
  }

  return resolveNextPath(next);
}
