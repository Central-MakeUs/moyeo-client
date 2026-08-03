/** 참여자 목록에서 "나"를 가려내는 데 필요한 참여자 쪽 정보. */
export interface ParticipantIdentityFields {
  /** 연결된 서비스 사용자 ID. 게스트 참여자는 `null`. */
  userId: number | null;
  /** 모임 안에서 표시하는 닉네임. */
  nickname: string;
}

/** 지금 화면을 보고 있는 사람의 신원. */
export interface ViewerIdentity {
  /** 로그인 사용자의 서비스 사용자 ID. 비로그인이면 `null`. */
  userId: number | null;
  /** 이 모임에서 쓰는 게스트 닉네임. 게스트가 아니면 `null`. */
  guestNickname: string | null;
}

/**
 * 이 참여자가 나인지 판단한다.
 *
 * 로그인 여부를 먼저 본다 — 계정이 있으면 서버가 준 `userId`가 정본이고, 게스트 저장소는
 * 토큰이 없는 사람을 위한 보조 수단이라 이를 덮어쓰지 않는다(`resolveMeetingViewerRole`과
 * 같은 원칙).
 *
 * 게스트는 `userId`가 없어 닉네임으로 찾을 수밖에 없다. 이때 게스트 행(`userId === null`)만
 * 본다 — 서버가 회원·방장 닉네임 중복을 허용하므로, 이름만 맞다고 남의 줄에 "(나)"를 붙일 수
 * 있기 때문이다. 한 모임 안에서 게스트 닉네임은 고유하다(게스트 API가 닉네임으로 참여자를
 * 지목한다).
 */
export function isViewerParticipant(
  participant: ParticipantIdentityFields,
  viewer: ViewerIdentity
): boolean {
  if (viewer.userId !== null) return participant.userId === viewer.userId;

  if (viewer.guestNickname === null) return false;

  return participant.userId === null && participant.nickname === viewer.guestNickname;
}
