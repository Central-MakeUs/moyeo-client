import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ScheduleResponseRequest } from '@/shared/api';

export type PlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';
export type ScheduleInputType = 'DATE_ONLY' | 'DATE_AND_TIME';
export type TransportationMode = 'PUBLIC_TRANSIT' | 'CAR';

/** 화면이 고른 출발지. 최종 요청에서 transportationMode와 합쳐 DepartureRequest가 된다. */
export interface DepartureDraft {
  /** 표시명. 목록·필드에 보여줄 이름이며 요청의 name으로도 쓴다. */
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateMeetingDraftState {
  name: string;
  description: string;
  maxParticipants: number | null;
  planningType: PlanningType | null;
  scheduleInputType: ScheduleInputType | null;
  availableStartTime: string | null; // 'HH:mm'
  availableEndTime: string | null; // 'HH:mm'
  deadlineMinutes: number | null;
  noDeadline: boolean;
  /** INV-02-A 후보 날짜. 'yyyy-MM-dd' 오름차순·중복 없음(정렬은 호출부 책임). */
  scheduleCandidateDates: string[];
  /** INV-02-B 방장 본인의 가능 일정. 후보 날짜와 다른 필드다. */
  scheduleResponse: ScheduleResponseRequest | null;
  /** INV-03 방장 출발지. 위치 조율 모임에서만 채워진다. */
  departure: DepartureDraft | null;
  /** INV-03 방장 이동수단. 출발지 선택 전에도 독립적으로 고를 수 있다. */
  transportationMode: TransportationMode | null;
}

interface CreateMeetingDraftActions {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setMaxParticipants: (value: number | null) => void;
  setPlanningType: (value: PlanningType) => void;
  setScheduleInputType: (value: ScheduleInputType | null) => void;
  setAvailableStartTime: (value: string | null) => void;
  setAvailableEndTime: (value: string | null) => void;
  setDeadlineMinutes: (value: number | null) => void;
  setNoDeadline: (value: boolean) => void;
  setScheduleCandidateDates: (value: string[]) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
  setDeparture: (value: DepartureDraft | null) => void;
  setTransportationMode: (value: TransportationMode | null) => void;
  reset: () => void;
}

export type CreateMeetingDraftStore = CreateMeetingDraftState & CreateMeetingDraftActions;

const initialState: CreateMeetingDraftState = {
  name: '',
  description: '',
  maxParticipants: null,
  planningType: null,
  scheduleInputType: null,
  availableStartTime: null,
  availableEndTime: null,
  deadlineMinutes: null,
  noDeadline: false,
  scheduleCandidateDates: [],
  scheduleResponse: null,
  departure: null,
  transportationMode: null,
};

export const useCreateMeetingDraft = create<CreateMeetingDraftStore>()(
  persist(
    (set) => ({
      ...initialState,
      setName: (value) => set({ name: value }),
      setDescription: (value) => set({ description: value }),
      setMaxParticipants: (value) => set({ maxParticipants: value }),
      setPlanningType: (value) => set({ planningType: value }),
      setScheduleInputType: (value) => set({ scheduleInputType: value }),
      setAvailableStartTime: (value) => set({ availableStartTime: value }),
      setAvailableEndTime: (value) => set({ availableEndTime: value }),
      setDeadlineMinutes: (value) => set({ deadlineMinutes: value }),
      setNoDeadline: (value) => set({ noDeadline: value }),
      setScheduleCandidateDates: (value) => set({ scheduleCandidateDates: value }),
      setScheduleResponse: (value) => set({ scheduleResponse: value }),
      setDeparture: (value) => set({ departure: value }),
      setTransportationMode: (value) => set({ transportationMode: value }),
      reset: () => set(initialState),
    }),
    {
      name: 'create-meeting-draft',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
