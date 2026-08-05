import type { SessionState } from '@/entities/session';

/** 현황 화면(VIEW-01)을 보고 있는 사람이 이 모임에서 갖는 역할. */
export type MeetingViewerRole =
  /** 모임장. 소셜 로그인 사용자. */
  | 'host'
  /** 참여자. 소셜 로그인 사용자. */
  | 'member'
  /** 참여자. 게스트로 참여했고 계정이 없다. */
  | 'guest'
  /** 이 모임에 참여하지 않았다. 링크만 열어본 사람도 여기 해당한다. */
  | 'non-participant';

/** 로그인 사용자의 모임 참여 조회(`GET .../members/me/participation`) 결과. */
export type ParticipationLookup =
  /** 조회 중. */
  | { status: 'pending' }
  /** 참여자다. */
  | { status: 'participant'; participantType: 'HOST' | 'MEMBER' | 'GUEST' }
  /** 404 — 이 모임의 참여자가 아니다. */
  | { status: 'non-participant' }
  /** 404가 아닌 실패. 참여 여부를 알 수 없다. */
  | { status: 'unknown' };

export interface ResolveMeetingViewerRoleParams {
  /** 세션 상태. `useSession()`의 판별 필드만 쓴다. */
  sessionStatus: SessionState['status'];
  /** 로그인 사용자일 때의 참여 조회 결과. 비로그인이면 무시된다. */
  participation: ParticipationLookup;
  /** 저장된 게스트 닉네임. 없으면 `null`. */
  guestNickname: string | null;
  /** 게스트 저장소 확인을 마쳤는지. `false`면 아직 게스트 여부를 단정할 수 없다. */
  isGuestRestored: boolean;
}

/**
 * 현재 사용자의 모임 내 역할을 정한다.
 *
 * 아직 판별할 근거가 모이지 않았으면 `null`을 돌려준다. 호출부는 `null`인 동안 역할에
 * 따라 갈리는 UI(뒤로가기·메뉴 버튼)를 숨긴다. 참여자가 아닌 사람에게 잠깐 메뉴가
 * 보였다 사라지는 것보다, 늦게 나타나는 편이 낫기 때문이다.
 *
 * 로그인 여부를 먼저 본다. 로그인 사용자의 참여 여부는 서버가 정본이고, 게스트 저장소는
 * 토큰이 없는 사람을 위한 보조 수단이라 로그인 상태의 판단을 덮어쓰지 않는다.
 */
export function resolveMeetingViewerRole({
  sessionStatus,
  participation,
  guestNickname,
  isGuestRestored,
}: ResolveMeetingViewerRoleParams): MeetingViewerRole | null {
  // 로그인 여부 자체를 모르면 게스트 저장소를 봐도 결론이 뒤집힐 수 있다.
  if (sessionStatus === 'loading') return null;

  if (sessionStatus === 'authenticated') {
    switch (participation.status) {
      case 'participant':
        // 게스트 참여는 이 API가 다루지 않지만, 서버가 준 값을 그대로 존중한다.
        if (participation.participantType === 'HOST') return 'host';
        if (participation.participantType === 'MEMBER') return 'member';
        return 'guest';
      case 'non-participant':
        return 'non-participant';
      // pending·unknown은 아직(또는 끝내) 알 수 없다.
      default:
        return null;
    }
  }

  // 여기부터는 anonymous 또는 error다. 토큰이 없으니 게스트 저장소가 유일한 단서다.
  // 세션 조회 실패(error)도 마찬가지로 다룬다 — 게스트 신원은 세션과 무관하게 남아 있다.
  if (!isGuestRestored) return null;

  return guestNickname ? 'guest' : 'non-participant';
}
