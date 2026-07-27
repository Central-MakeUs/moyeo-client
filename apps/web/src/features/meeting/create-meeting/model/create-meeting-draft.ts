import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ScheduleResponseRequest } from '@/shared/api';

export type PlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';
export type ScheduleInputType = 'DATE_ONLY' | 'DATE_AND_TIME';

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
}

interface CreateMeetingDraftActions {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setMaxParticipants: (value: number | null) => void;
  setPlanningType: (value: PlanningType) => void;
  setScheduleInputType: (value: ScheduleInputType | null) => void;
  setAvailableStartTime: (value: string) => void;
  setAvailableEndTime: (value: string) => void;
  setDeadlineMinutes: (value: number | null) => void;
  setNoDeadline: (value: boolean) => void;
  setScheduleCandidateDates: (value: string[]) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
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
      reset: () => set(initialState),
    }),
    {
      name: 'create-meeting-draft',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
