import { create } from 'zustand';

import type { DepartureDraft } from '@/entities/place';
import type { DepartureRequestTransportationMode } from '@/shared/api';

export interface EditDepartureDraftSeed {
  departure: DepartureDraft | null;
  transportationMode: DepartureRequestTransportationMode | null;
}

interface EditDepartureDraftState extends EditDepartureDraftSeed {
  /** 어느 모임을 수정 중인지. 다른 모임의 값을 이어받지 않으려고 함께 들고 있다. */
  inviteCode: string | null;
  /** 서버가 준 기존 응답으로 초안을 연다. 이미 이 모임을 편집 중이면 아무것도 하지 않는다. */
  open: (inviteCode: string, seed: EditDepartureDraftSeed) => void;
  setDeparture: (value: DepartureDraft) => void;
  setTransportationMode: (value: DepartureRequestTransportationMode) => void;
  close: () => void;
}

const EMPTY = {
  inviteCode: null,
  departure: null,
  transportationMode: null,
} as const;

/**
 * 출발지 수정 중인 값을 화면 사이에서 유지한다.
 *
 * 출발지 검색은 별도 화면이라 다녀오는 동안 컴포넌트 상태가 사라진다. 그래서 아직 저장하지
 * 않은 값을 여기 둔다 — 참여 플로우의 초안(`useGuestJoinDraft`)과 같은 이유다.
 *
 * 다만 **원본은 서버에 있다.** `open`은 다른 모임을 편집하러 왔을 때만 씨앗값을 덮는다.
 * 매번 덮으면 검색에서 돌아올 때마다 방금 고른 출발지가 서버 값으로 되돌아간다.
 */
export const useEditDepartureDraft = create<EditDepartureDraftState>((set, get) => ({
  ...EMPTY,
  open: (inviteCode, seed) => {
    if (get().inviteCode === inviteCode) return;
    set({ inviteCode, ...seed });
  },
  setDeparture: (departure) => set({ departure }),
  setTransportationMode: (transportationMode) => set({ transportationMode }),
  close: () => set({ ...EMPTY }),
}));
