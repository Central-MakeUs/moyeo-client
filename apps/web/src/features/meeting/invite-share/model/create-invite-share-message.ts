export const INVITE_SHARE_IMAGE_URL = 'https://medieval-tomato-osvvo9iw.edgeone.dev/file.png';
export const INVITE_SHARE_MESSAGE = '모임에 참여해서 일정과 위치를 정해보세요!';

/**
 * 링크를 실제로 공유한 사용자를 기준으로 초대 문구 타이틀을 만든다.
 * 모임장과 공유자가 다를 수 있으므로 모임 응답의 hostNickname을 사용하지 않는다.
 */
export function createInviteShareTitle(senderNickname: string): string {
  return `${senderNickname}님이 보내신 초대장이 왔어요`;
}

export function createInviteSmsMessage(senderNickname: string): string {
  return `💌[모여] ${createInviteShareTitle(senderNickname)}. ${INVITE_SHARE_MESSAGE}`;
}
