/**
 * 로그인 후 복귀 경로(`?next=`) 처리.
 *
 * 초대 링크(`/i/[inviteToken]`)가 핵심 진입점이므로, 로그인 때문에 목적지를 잃으면 안 된다.
 * 동시에 외부 주소로 튕기는 open redirect를 막아야 한다.
 */

export const NEXT_PARAM = 'next';
export const DEFAULT_NEXT_PATH = '/';

/**
 * 내부 절대 경로만 허용한다. 그 외에는 `null`을 돌려 호출부가 기본 경로로 보내게 한다.
 *
 * 거부: 다른 출처(`//evil.com`), 백슬래시 우회(`/\evil.com`), 스킴(`https://...`), 상대 경로.
 */
export function toSafeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (next.startsWith('/\\')) return null;

  return next;
}

/**
 * 가드가 로그인 화면으로 보낼 때 쓰는 경로. 현재 위치를 `next`로 보존한다.
 */
export function buildLoginPath(from: string | null | undefined): string {
  const safeFrom = toSafeNextPath(from);
  if (!safeFrom) return '/login';

  return `/login?${NEXT_PARAM}=${encodeURIComponent(safeFrom)}`;
}

/**
 * 로그인 성공 후 이동할 경로.
 */
export function resolveNextPath(next: string | null | undefined): string {
  return toSafeNextPath(next) ?? DEFAULT_NEXT_PATH;
}
