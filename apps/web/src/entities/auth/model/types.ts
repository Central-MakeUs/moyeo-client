export type OAuthProvider = 'apple' | 'kakao';

export interface OAuthTransaction {
  provider: OAuthProvider;
  state: string;
  nonce?: string; // apple 전용
  /**
   * 로그인 후 돌아갈 내부 경로.
   *
   * 공급자 페이지로 나갔다 오는 동안 `/login?next=`가 사라지므로 트랜잭션에 실어 보낸다.
   * (초대 링크로 진입한 사용자가 로그인 때문에 목적지를 잃지 않게 하기 위함)
   */
  next?: string;
}
