import type { GuestIdentity } from './guest-join-draft';

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
export function isDraftUsableFor(identity: GuestIdentity | null, inviteToken: string): boolean {
  return identity !== null && identity.inviteToken === inviteToken;
}
