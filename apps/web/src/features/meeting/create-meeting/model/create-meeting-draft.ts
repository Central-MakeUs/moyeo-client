import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DepartureDraft } from '@/entities/place';
import type { ScheduleResponseRequest } from '@/shared/api';

import { pruneHostScheduleResponse } from './prune-host-schedule-response';

export type PlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';
export type ScheduleInputType = 'DATE_ONLY' | 'DATE_AND_TIME';
export type TransportationMode = 'PUBLIC_TRANSIT' | 'CAR';

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

/** 조율 범위를 이루는 세 필드. 하나라도 바뀌면 방장 응답을 다시 걸러야 한다. */
type ScheduleBoundsInput = Pick<
  CreateMeetingDraftState,
  'scheduleCandidateDates' | 'availableStartTime' | 'availableEndTime'
>;

/**
 * 조율 범위를 바꾸면서 방장 본인의 응답을 함께 정리한다.
 *
 * 시간표에서 고른 응답은 후보 날짜와 공통 시간 범위 안에서만 의미가 있다. 범위만 좁히고
 * 응답을 두면 화면에는 보이지 않는 선택이 초안에 남아 생성 요청에 실려 나간다.
 * 세 setter가 같은 규칙을 쓰므로 여기 한 번만 둔다.
 */
function withPrunedScheduleResponse(
  state: CreateMeetingDraftState,
  next: Partial<ScheduleBoundsInput>
): Partial<CreateMeetingDraftState> {
  const bounds = { ...state, ...next };

  return {
    ...next,
    scheduleResponse: pruneHostScheduleResponse(state.scheduleResponse, {
      candidateDates: bounds.scheduleCandidateDates,
      availableStartTime: bounds.availableStartTime,
      availableEndTime: bounds.availableEndTime,
    }),
  };
}

export const useCreateMeetingDraft = create<CreateMeetingDraftStore>()(
  persist(
    (set) => ({
      ...initialState,
      setName: (value) => set({ name: value }),
      setDescription: (value) => set({ description: value }),
      setMaxParticipants: (value) => set({ maxParticipants: value }),
      setPlanningType: (value) => set({ planningType: value }),
      setScheduleInputType: (value) => set({ scheduleInputType: value }),
      setAvailableStartTime: (value) =>
        set((state) => withPrunedScheduleResponse(state, { availableStartTime: value })),
      setAvailableEndTime: (value) =>
        set((state) => withPrunedScheduleResponse(state, { availableEndTime: value })),
      setDeadlineMinutes: (value) => set({ deadlineMinutes: value }),
      setNoDeadline: (value) => set({ noDeadline: value }),
      setScheduleCandidateDates: (value) =>
        set((state) => withPrunedScheduleResponse(state, { scheduleCandidateDates: value })),
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
