const APP_LINK_HOSTS = new Set(['moyeo-web.vercel.app', 'moyeo-dev.vercel.app']);

function getInvitePath(path: string): string | null {
  try {
    const url = new URL(path);
    if (url.protocol !== 'https:' || !APP_LINK_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.startsWith('/i/')) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  const invitePath = getInvitePath(path);
  if (!invitePath) return path;

  return `/?appLinkPath=${encodeURIComponent(invitePath)}`;
}
