'use client';

import dynamic from 'next/dynamic';

/**
 * dev 로그인 패널의 노출 지점.
 *
 * `NEXT_PUBLIC_*`는 빌드 타임에 리터럴로 치환되므로, 플래그가 꺼진 빌드에서는 삼항 연산자에 의해 null이 되며
 * `import()` 자체가 사라진다. 즉 패널 코드가 번들에 남지 않는다.
 *
 * `NODE_ENV`를 쓰지 않는 이유: Vercel preview 배포도 production 빌드라 정작 필요한 곳에서 죽는다.
 * 프로덕션 안전장치는 서버가 담당한다 — `POST /api/auth/dev/tokens`는 local·dev 프로필 전용이다.
 */
const DevAuthPanel =
  process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === 'true'
    ? dynamic(() => import('@/features/dev-auth').then((mod) => mod.DevAuthPanel), { ssr: false })
    : null;

export function DevAuthPanelMount() {
  if (!DevAuthPanel) return null;

  return <DevAuthPanel />;
}
