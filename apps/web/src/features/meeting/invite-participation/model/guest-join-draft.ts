import { create } from 'zustand';

import type { ScheduleResponseRequest } from '@/shared/api';

import { pruneScheduleResponse } from './prune-schedule-response';

export interface GuestIdentity {
  inviteToken: string;
  nickname: string;
  password: string;
}

interface GuestJoinDraftState {
  identity: GuestIdentity | null;
  /** 참여자가 고른 가능한 날짜 또는 시간 범위. 아직 고르지 않았으면 null. */
  scheduleResponse: ScheduleResponseRequest | null;
  setIdentity: (identity: GuestIdentity) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
  /** 서버가 준 후보 날짜로 무효한 선택을 즉시 걷어낸다 (prd.md ADR-4). */
  syncCandidateDates: (candidateDates: string[]) => void;
  reset: () => void;
}

/**
 * 게스트 참여 단계 사이에서 아직 제출하지 않은 입력을 유지합니다.
 *
 * `persist`를 쓰지 않습니다. 초안에 참여 비밀번호가 들어가므로 디스크에 남기지 않는 쪽을
 * 택했습니다(prd.md ADR-1). 모임장 위저드(`useCreateMeetingDraft`)와 지속성 정책이 다릅니다.
 */
export const useGuestJoinDraft = create<GuestJoinDraftState>((set) => ({
  identity: null,
  scheduleResponse: null,
  setIdentity: (identity) => set({ identity }),
  setScheduleResponse: (value) => set({ scheduleResponse: value }),
  syncCandidateDates: (candidateDates) =>
    set((state) => ({
      scheduleResponse: pruneScheduleResponse(state.scheduleResponse, candidateDates),
    })),
  reset: () => set({ identity: null, scheduleResponse: null }),
}));
