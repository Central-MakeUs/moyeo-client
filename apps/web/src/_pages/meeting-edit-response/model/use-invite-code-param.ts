'use client';

import { useSearchParams } from 'next/navigation';

/**
 * 현황·확정 화면과 같은 쿼리 키. 경로에 `meetingId`를 넣지 않는다 — 게스트가 쓰는 API는
 * 전부 초대 코드 기반이라 `meetingId`로는 접근할 수 없다.
 */
const INVITE_CODE_PARAM = 'code';

/** 응답 수정 화면들이 대상 모임을 알아내는 방법. 없으면 빈 문자열이라 조회가 걸리지 않는다. */
export function useInviteCodeParam(): string {
  return useSearchParams().get(INVITE_CODE_PARAM) ?? '';
}
