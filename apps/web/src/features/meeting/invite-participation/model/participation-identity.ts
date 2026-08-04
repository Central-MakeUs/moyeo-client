export type ParticipantKind = 'guest' | 'member';

/**
 * 참여자 신원.
 *
 * 게스트와 회원은 **입력 단계가 완전히 같고** 제출 API만 다르다. 그래서 초안은 하나로 두고
 * 신원만 판별 유니온으로 가른다. `kind`로 좁히면 제출 시점에 `password` 유무가 타입으로
 * 보장되므로, 호출부마다 "지금 게스트인가 회원인가"를 되물을 필요가 없다.
 */
export type ParticipationIdentity =
  | { kind: 'guest'; inviteToken: string; nickname: string; password: string }
  | { kind: 'member'; inviteToken: string; nickname: string };

export type GuestParticipationIdentity = Extract<ParticipationIdentity, { kind: 'guest' }>;
export type MemberParticipationIdentity = Extract<ParticipationIdentity, { kind: 'member' }>;

const GUEST_PASSWORD_PATTERN = /^\d{4}$/;

/** 게스트 비밀번호가 API의 숫자 4자리 계약을 만족하는지 확인합니다. */
export function isValidGuestPassword(value: string): boolean {
  return GUEST_PASSWORD_PATTERN.test(value);
}

/**
 * 참여 초안이 지금 보고 있는 모임의 것인지 확인합니다.
 *
 * 초안은 메모리에만 있으므로 새 문서 로드에서는 비어 있지만, 클라이언트 내비게이션으로 다른
 * 초대 링크에 도달하면 남아 있을 수 있습니다. 그대로 쓰면 다른 모임에 잘못된 닉네임·일정이
 * 제출됩니다(prd.md ADR-2).
 */
export function isDraftUsableFor(
  identity: Pick<ParticipationIdentity, 'inviteToken'> | null,
  inviteToken: string
): boolean {
  return identity !== null && identity.inviteToken === inviteToken;
}
