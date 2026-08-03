'use client';

import * as React from 'react';

import { readGuestSession } from './guest-session-storage';

export interface GuestSessionState {
  /** 이 모임에서 쓰는 게스트 닉네임. 게스트가 아니면 `null`. */
  nickname: string | null;
  /**
   * 저장소 확인을 마쳤는지.
   *
   * 서버 렌더와 첫 클라이언트 렌더에서는 `false`다. localStorage는 서버에 없으므로
   * 첫 렌더에 값을 읽으면 hydration이 어긋난다. 호출부는 이 값이 `false`인 동안
   * "게스트가 아니다"로 단정하지 않는다.
   */
  isRestored: boolean;
}

const INITIAL: GuestSessionState = { nickname: null, isRestored: false };

/** 저장된 게스트 세션을 읽는다. 게스트 여부 판별에만 쓴다. */
export function useGuestSession(inviteCode: string): GuestSessionState {
  const [state, setState] = React.useState<GuestSessionState>(INITIAL);

  React.useEffect(() => {
    setState({ nickname: readGuestSession(inviteCode), isRestored: true });
  }, [inviteCode]);

  return state;
}
