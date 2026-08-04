import type { GuestJoinRequest } from '@/shared/api';

import type { GuestIdentity, GuestJoinDraftInput } from './guest-join-draft';

export interface GuestJoinDraftSnapshot extends GuestJoinDraftInput {
  identity: GuestIdentity;
}

/**
 * 참여 초안을 게스트 참여 요청으로 바꾼다.
 *
 * 값이 없는 항목은 키를 아예 넣지 않는다. `GuestJoinRequest`에서 optional이고, `undefined`를
 * 실어 보내면 서버 검증에 걸릴 수 있다.
 */
export function toGuestJoinRequest({
  identity,
  scheduleResponse,
  departure,
  transportationMode,
}: GuestJoinDraftSnapshot): GuestJoinRequest {
  // 이동수단이 DepartureRequest의 필수 필드라 둘 다 있어야 departure를 구성할 수 있다.
  const hasDeparture = departure !== null && transportationMode !== null;

  return {
    nickname: identity.nickname,
    password: identity.password,
    ...(scheduleResponse === null ? {} : { scheduleResponse }),
    ...(hasDeparture ? { departure: { ...departure, transportationMode } } : {}),
  };
}
