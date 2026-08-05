import { create } from 'zustand';

import type { DepartureDraft } from '@/entities/place';
import type { DepartureRequestTransportationMode, ScheduleResponseRequest } from '@/shared/api';

import type { ParticipationIdentity } from './participation-identity';
import { pruneScheduleResponse } from './prune-schedule-response';

/**
 * 참여자가 화면에서 채우는 값. 신원(`identity`)과 달리 모임 유형에 따라 필요한 것이 다르다.
 *
 * `planningType`은 여기 넣지 않는다. 서버가 초대별로 정해둔 사실이고 각 라우트가 초대 조회로
 * 받아 props로 내려준다. 초안이 사본을 들면 동기화 문제가 따라온다.
 */
export interface ParticipationDraftInput {
  /** 참여자가 고른 가능한 날짜 또는 시간 범위. 아직 고르지 않았으면 null. */
  scheduleResponse: ScheduleResponseRequest | null;
  /** 참여자가 고른 출발지. 아직 고르지 않았으면 null. */
  departure: DepartureDraft | null;
  /** 이동수단. 출발지 선택 전에도 독립적으로 고를 수 있다. */
  transportationMode: DepartureRequestTransportationMode | null;
}

interface ParticipationDraftState extends ParticipationDraftInput {
  identity: ParticipationIdentity | null;
  setIdentity: (identity: ParticipationIdentity) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
  setDeparture: (value: DepartureDraft | null) => void;
  setTransportationMode: (value: DepartureRequestTransportationMode | null) => void;
  /** 서버가 준 후보 날짜로 무효한 선택을 즉시 걷어낸다 (prd.md ADR-4). */
  syncCandidateDates: (candidateDates: string[]) => void;
  reset: () => void;
}

const EMPTY_INPUT: ParticipationDraftInput = {
  scheduleResponse: null,
  departure: null,
  transportationMode: null,
};

/**
 * 참여 단계 사이에서 아직 제출하지 않은 입력을 유지합니다.
 *
 * 게스트와 회원이 하나의 초안을 공유합니다. 담는 값이 같고 거치는 화면도 같아서, 초안을
 * 둘로 나누면 그 값을 읽는 모든 곳이 "지금 누구인가"를 되묻게 됩니다. 다른 것은 신원의
 * `kind`와 제출 API뿐입니다.
 *
 * `persist`를 쓰지 않습니다. 초안에 게스트 참여 비밀번호가 들어가므로 디스크에 남기지 않는
 * 쪽을 택했습니다(prd.md ADR-1). 모임장 위저드(`useCreateMeetingDraft`)와 지속성 정책이
 * 다릅니다.
 */
export const useParticipationDraft = create<ParticipationDraftState>((set) => ({
  identity: null,
  ...EMPTY_INPUT,

  /**
   * 참여자가 바뀌면(다른 종류이거나 다른 모임이면) 이전 입력을 버린다.
   * 같은 참여자가 신원 화면으로 돌아와 다시 제출한 경우에는 입력을 유지한다.
   */
  setIdentity: (identity) =>
    set((state) => {
      const isSameParticipant =
        state.identity !== null &&
        state.identity.kind === identity.kind &&
        state.identity.inviteToken === identity.inviteToken;

      return isSameParticipant ? { identity } : { identity, ...EMPTY_INPUT };
    }),

  setScheduleResponse: (value) => set({ scheduleResponse: value }),
  setDeparture: (value) => set({ departure: value }),
  setTransportationMode: (value) => set({ transportationMode: value }),
  syncCandidateDates: (candidateDates) =>
    set((state) => ({
      scheduleResponse: pruneScheduleResponse(state.scheduleResponse, candidateDates),
    })),
  reset: () => set({ identity: null, ...EMPTY_INPUT }),
}));
