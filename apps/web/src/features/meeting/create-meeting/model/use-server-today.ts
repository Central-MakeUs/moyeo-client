'use client';

import { useGetServerTime } from '@/shared/api';

import { toServerToday } from './to-server-today';

export interface UseServerTodayResult {
  /** 서비스 기준 오늘 'yyyy-MM-dd'. 조회 전·실패 시 null. */
  serverToday: string | null;
  /** serverTime 파싱 실패도 'error'로 본다. */
  status: 'pending' | 'error' | 'success';
  /** 실패 후 재시도. */
  refetch: () => void;
}

/**
 * 날짜 활성화 판단의 기준이 되는 서버 오늘 (spec-fixed §7).
 * 조회에 성공했어도 serverTime을 못 읽으면 error로 내린다 — 로컬 시각으로 대체하지 않는다.
 */
export function useServerToday(): UseServerTodayResult {
  const { data, status, refetch } = useGetServerTime();

  const serverToday = status === 'success' ? toServerToday(data?.serverTime) : null;

  return {
    serverToday,
    status: status === 'success' && serverToday === null ? 'error' : status,
    refetch: () => {
      refetch();
    },
  };
}
