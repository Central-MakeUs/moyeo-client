import {
  buildKakaoAuthorizeUrl,
  generateState,
  getKakaoClientId,
  getKakaoRedirectTarget,
  getRedirectUri,
  saveOAuthTransaction,
} from '@/entities/auth';
import { toSafeNextPath } from '@/entities/session';

/**
 * 카카오 authorize 페이지로 이동한다.
 * `next`는 로그인 후 돌아갈 내부 경로이며, 왕복 동안 유실되지 않도록 트랜잭션에 함께 저장한다.
 */
export function startKakaoLogin(next?: string | null): void {
  // code 교환에 사용할 서버 콜백 환경이 올바르게 설정됐는지 이동 전에 검증한다.
  getKakaoRedirectTarget();

  const state = generateState();
  const safeNext = toSafeNextPath(next);

  saveOAuthTransaction({
    provider: 'kakao',
    state,
    ...(safeNext ? { next: safeNext } : {}),
  });

  const url = buildKakaoAuthorizeUrl({
    clientId: getKakaoClientId(),
    redirectUri: getRedirectUri('kakao'),
    state,
  });

  window.location.assign(url);
}
