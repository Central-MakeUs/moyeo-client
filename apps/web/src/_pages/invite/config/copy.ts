/**
 * 초대장 화면의 고정 문구.
 *
 * 모임 조회 결과와 무관하게 항상 같은 값이라, 조회를 기다리는 `loading.tsx`도 이 문구를
 * 그대로 그린다. 같은 문구를 두 곳에 적지 않으려고 여기로 뺐다.
 */
export const INVITE_LANDING_TITLE = '모임 초대장이 왔어요!';
export const INVITE_LANDING_DESCRIPTION = '모임에 참여해서 일정과 장소를 정해보세요';

/** 참여하지 않고 빠져나가는 곳. 다른 완료 화면의 "홈으로 돌아가기"와 같은 목적지다. */
export const INVITE_LANDING_HOME_PATH = '/home';
