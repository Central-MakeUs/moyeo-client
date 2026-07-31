/**
 * shared/api public API.
 *
 * 상위 layer는 `@/shared/api/generated/...` 같은 내부 경로를 직접 참조하지 않고 여기만 쓴다.
 * (steiger `fsd/no-public-api-sidestep`)
 *
 * `generated` 아래는 Orval이 `clean: true`로 재생성하므로 이 파일을 그쪽에 두지 않는다.
 * 새 태그를 쓰게 되면 아래에 re-export를 추가한다.
 */

export * from './generated/auth/auth';
export * from './generated/development-auth/development-auth';
export * from './generated/member/member';
export * from './generated/time/time';
export * from './generated/schemas';

export { AXIOS_INSTANCE, customInstance } from './axios-instance';
export type { BodyType, ErrorType } from './axios-instance';

export {
  configureAuth,
  getAuthToken,
  isUnauthorizedExempt,
  notifyUnauthorized,
} from './auth-token';
