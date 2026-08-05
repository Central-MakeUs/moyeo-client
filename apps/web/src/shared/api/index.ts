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
export * from './generated/feedback/feedback';
export * from './generated/meeting/meeting';
export * from './generated/member/member';
export * from './generated/time/time';
export * from './generated/departure-place/departure-place';
export * from './generated/meeting/meeting';
// my-place(저장 장소)는 1차 출시 범위에서 제외됐다. 되살릴 때 이 줄만 다시 열면 된다.
// export * from './generated/my-place/my-place';
export * from './generated/schemas';

export { createMeeting, buildCreateMeetingFormData, CREATE_MEETING_PATH } from './create-meeting';
export { fetchServerToday } from './fetch-server-today';

export { AXIOS_INSTANCE, customInstance } from './axios-instance';
export type { BodyType, ErrorType } from './axios-instance';

export {
  configureAuth,
  getAuthToken,
  isUnauthorizedExempt,
  notifyUnauthorized,
} from './auth-token';
