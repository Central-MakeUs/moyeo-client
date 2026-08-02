import { create } from 'zustand';

interface GuestIdentity {
  inviteToken: string;
  nickname: string;
  password: string;
}

interface GuestJoinDraftState {
  identity: GuestIdentity | null;
  setIdentity: (identity: GuestIdentity) => void;
  reset: () => void;
}

/** 게스트 참여 단계 사이에서 아직 제출하지 않은 신원 정보를 유지합니다. */
export const useGuestJoinDraft = create<GuestJoinDraftState>((set) => ({
  identity: null,
  setIdentity: (identity) => set({ identity }),
  reset: () => set({ identity: null }),
}));
