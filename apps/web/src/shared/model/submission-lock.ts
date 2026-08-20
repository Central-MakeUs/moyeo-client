import { create } from 'zustand';

export interface SubmissionLockStore {
  /** 제출이 진행 중이라 화면의 입력을 잠가야 하면 `true`. */
  isSubmitting: boolean;
  lock: () => void;
  unlock: () => void;
}

/**
 * 제출 중 화면 잠금 상태를 공유한다.
 *
 * 제출 훅과 상위 레이아웃처럼 React 트리에서 떨어진 소비자가 같은 상태를 읽어야 하므로
 * 전역 store로 관리한다.
 *
 * 제출에 실패하면 즉시 해제하고, 성공하면 다음 화면으로 전환되어 제출 훅이 언마운트될 때
 * 해제한다.
 */
export const useSubmissionLock = create<SubmissionLockStore>((set) => ({
  isSubmitting: false,
  lock: () => set({ isSubmitting: true }),
  unlock: () => set({ isSubmitting: false }),
}));
