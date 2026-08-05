'use client';

import { useGetInvitation } from '@/shared/api';

import { toMeetingInvitation, type MeetingInvitation } from '../model/to-meeting-invitation';

/**
 * 초대 코드로 모임 정보를 조회한다.
 *
 * 응답을 그대로 주지 않고 `toMeetingInvitation`으로 정규화해서 넘긴다 — 화면은 optional
 * 필드를 다시 풀어보지 않는다. 모임 이름이 없으면 `data`가 `null`이다.
 *
 * 서버에서 이미 같은 초대를 조회하는 화면(INV-01)이라면 이 훅 대신 서버가 받은 값을 props로
 * 내리는 편이 낫다. 같은 데이터를 두 번 가져오지 않기 위함이다.
 */
export function useInvitation(inviteCode: string) {
  return useGetInvitation<MeetingInvitation | null>(inviteCode, {
    query: {
      enabled: inviteCode.length > 0,
      select: toMeetingInvitation,
    },
  });
}
