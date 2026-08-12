const APP_LINK_HOSTS = new Set(['moyeo-web.vercel.app', 'moyeo-dev.vercel.app']);

/**
 * `app.json`의 `scheme`.
 */
const APP_SCHEME = 'moyeo:';

/** 공유 링크의 진입점 */
const INVITE_PATH_PREFIX = '/i/';

/**
 * 들어온 URL에서 초대 경로 부분(`/i/{token}`)만 추출하는 함수
 */
function toInvitePath(url: URL): string | null {
  if (url.protocol === 'https:') {
    return APP_LINK_HOSTS.has(url.hostname) ? url.pathname : null;
  }

  if (url.protocol === APP_SCHEME) {
    return `/${url.hostname}${url.pathname}`.replace(/\/{2,}/g, '/');
  }

  // 카카오톡 공유 카드의 실행 파라미터로 앱이 열린 경우의 처리
  // `kakao{네이티브_앱_키}://kakaolink?path=...`라 스킴에 키가 섞여 있는 형태
  // 콘솔에서 키를 바꿀 때 조용히 깨지므로, 접두사와 host로만 판별
  if (url.protocol.startsWith('kakao') && url.hostname === 'kakaolink') {
    return url.searchParams.get('path');
  }

  return null;
}

function getInvitePath(path: string): string | null {
  try {
    const url = new URL(path);
    const invitePath = toInvitePath(url);
    if (invitePath === null || !invitePath.startsWith(INVITE_PATH_PREFIX)) return null;

    return `${invitePath}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * 앱이 처음 열릴 때의 URL을 처리하는 함수
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  const invitePath = getInvitePath(path);
  if (!invitePath) return __DEV__ ? path : '/';

  return `/?appLinkPath=${encodeURIComponent(invitePath)}`;
}
