/**
 * 화면이 고른 출발지. 최종 요청에서 이동수단과 합쳐 `DepartureRequest`가 된다.
 *
 * 모임장 위저드와 게스트 참여가 함께 쓰므로 entities에 둔다. features끼리는 서로 import할 수
 * 없어서, `create-meeting`에 두면 게스트가 쓸 수 없다.
 */
export interface DepartureDraft {
  /** 표시명. 목록·필드에 보여줄 이름이며 요청의 name으로도 쓴다. */
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}
