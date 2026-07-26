/**
 * HTTP client가 쓰는 인증 훅 지점.
 *
 * `shared`는 상위 layer(session entity)를 import할 수 없으므로, 세션 쪽이 여기에 구현을
 * 주입한다. 이 파일 자체는 세션이 어디에 저장되는지 알지 못한다.
 */

type AuthTokenReader = () => string | null;
type UnauthorizedHandler = () => void;

let readAuthToken: AuthTokenReader = () => null;
let handleUnauthorized: UnauthorizedHandler = () => {};

/**
 * configureAuth
 * HTTP Client에 세션 구현을 주입하는 함수
 * @param config
 */
export function configureAuth(config: {
  readAuthToken: AuthTokenReader;
  onUnauthorized: UnauthorizedHandler;
}): void {
  readAuthToken = config.readAuthToken;
  handleUnauthorized = config.onUnauthorized;
}

export function getAuthToken(): string | null {
  return readAuthToken();
}

export function notifyUnauthorized(): void {
  handleUnauthorized();
}

/**
 * 로그인 시도 자체의 실패는 세션 만료가 아니므로 401 처리 대상에서 제외
 */
const UNAUTHORIZED_EXEMPT_PATHS = ['/api/auth/dev/tokens', '/api/auth/apple'];

export function isUnauthorizedExempt(url: string | undefined): boolean {
  if (!url) return false;
  return UNAUTHORIZED_EXEMPT_PATHS.some((path) => url.includes(path));
}
