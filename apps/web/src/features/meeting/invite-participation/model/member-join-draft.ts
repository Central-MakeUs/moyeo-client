import { create } from 'zustand';

import type { DepartureDraft } from '@/entities/place';
import type { DepartureRequestTransportationMode, ScheduleResponseRequest } from '@/shared/api';

import { pruneScheduleResponse } from './prune-schedule-response';

export interface MemberIdentity {
  inviteToken: string;
  nickname: string;
}

interface MemberJoinDraftState {
  identity: MemberIdentity | null;
  scheduleResponse: ScheduleResponseRequest | null;
  departure: DepartureDraft | null;
  transportationMode: DepartureRequestTransportationMode | null;
  setIdentity: (identity: MemberIdentity) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
  setDeparture: (value: DepartureDraft | null) => void;
  setTransportationMode: (value: DepartureRequestTransportationMode | null) => void;
  syncCandidateDates: (candidateDates: string[]) => void;
  reset: () => void;
}

/** 로그인 회원의 여러 참여 입력 화면 사이에서 아직 제출하지 않은 값을 유지합니다. */
export const useMemberJoinDraft = create<MemberJoinDraftState>((set) => ({
  identity: null,
  scheduleResponse: null,
  departure: null,
  transportationMode: null,
  setIdentity: (identity) => set({ identity }),
  setScheduleResponse: (value) => set({ scheduleResponse: value }),
  setDeparture: (value) => set({ departure: value }),
  setTransportationMode: (value) => set({ transportationMode: value }),
  syncCandidateDates: (candidateDates) =>
    set((state) => ({
      scheduleResponse: pruneScheduleResponse(state.scheduleResponse, candidateDates),
    })),
  reset: () =>
    set({ identity: null, scheduleResponse: null, departure: null, transportationMode: null }),
}));
