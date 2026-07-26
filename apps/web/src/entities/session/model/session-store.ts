import { create } from 'zustand';

interface SessionStore {
  accessToken: string | null;
  /** 저장소 읽기와 네이티브 핸드셰이크가 끝났는지. false면 가드는 스플래시를 렌더한다. */
  isRestored: boolean;
  setToken: (accessToken: string) => void;
  clearToken: () => void;
  finishRestore: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  accessToken: null,
  isRestored: false,
  // 토큰이 정해졌다면 복원 절차도 끝난 것이다.
  setToken: (accessToken) => set({ accessToken, isRestored: true }),
  clearToken: () => set({ accessToken: null, isRestored: true }),
  finishRestore: () => set({ isRestored: true }),
}));
