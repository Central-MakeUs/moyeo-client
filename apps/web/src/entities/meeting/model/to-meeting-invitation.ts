import type { MeetingInvitationResponse } from '@/shared/api';

/**
 * 초대 화면이 그릴 수 있는 형태로 좁힌 모임 초대 정보.
 *
 * 응답 스키마는 모든 필드가 optional이라(`name?`, `hostNickname?`) 그대로 흘리면
 * fallback 처리가 화면마다 흩어진다. 정규화를 여기 한 곳에 모은다.
 */
export interface MeetingInvitation {
  /** 모임 이름. 이게 없으면 카드를 그릴 근거가 없다. */
  name: string;
  /** 모임 설명. 입력하지 않은 모임은 `null`이다. */
  description: string | null;
  /** 방장 닉네임. 받지 못하면 `null`이고, 카드는 방장 줄을 숨긴다. */
  hostNickname: string | null;
}

/** 공백만 있는 문자열은 값이 없는 것으로 본다. */
function toText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed !== undefined && trimmed.length > 0 ? trimmed : null;
}

/**
 * 초대 조회 응답을 카드가 쓸 형태로 바꾼다.
 *
 * 모임 이름이 없으면 보여줄 것이 없으므로 `null`을 반환한다. 이때 무엇을 대신 보여줄지는
 * 호출부가 정한다(안내 문구, 재시도 등).
 */
export function toMeetingInvitation(
  response: MeetingInvitationResponse | null | undefined
): MeetingInvitation | null {
  const name = toText(response?.name);
  if (name === null) return null;

  return {
    name,
    description: toText(response?.description),
    hostNickname: toText(response?.hostNickname),
  };
}
