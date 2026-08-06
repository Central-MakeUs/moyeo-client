/**
 * 초대 링크에서 "참여하기"를 눌렀을 때의 **입구 분기**만 담당하는 슬라이스다(prd.md ADR-1).
 * 세션·참여 가능 여부로 목적지를 정하고 로그인 Drawer 상태를 소유한다.
 * 실제 참여 제출(`joinMember`/`joinGuest`)은 여기서 다루지 않는다.
 */
export {
  resolveJoinDestination,
  type JoinDestination,
  type ResolveJoinDestinationParams,
} from './model/resolve-join-destination';
export { checkJoinDestination, type CheckedJoinDestination } from './model/check-join-destination';
export {
  useJoinEntry,
  type UseJoinEntryParams,
  type UseJoinEntryReturn,
  type JoinButtonState,
  type LoginDrawerState,
  type BlockedNoticeState,
} from './model/use-join-entry';
