import { describe, it, expect, beforeEach } from 'vitest';

import { useSubmissionLock } from './submission-lock';

describe('useSubmissionLock', () => {
  beforeEach(() => {
    useSubmissionLock.getState().unlock();
  });

  it('아무도 제출하지 않았으면 잠겨 있지 않다', () => {
    expect(useSubmissionLock.getState().isSubmitting).toBe(false);
  });

  it('lock()을 부르면 잠긴다', () => {
    useSubmissionLock.getState().lock();

    expect(useSubmissionLock.getState().isSubmitting).toBe(true);
  });

  it('unlock()을 부르면 다시 풀린다', () => {
    useSubmissionLock.getState().lock();
    useSubmissionLock.getState().unlock();

    expect(useSubmissionLock.getState().isSubmitting).toBe(false);
  });

  it('이미 잠긴 상태에서 lock()을 다시 불러도 잠긴 채로 남는다', () => {
    useSubmissionLock.getState().lock();
    useSubmissionLock.getState().lock();

    expect(useSubmissionLock.getState().isSubmitting).toBe(true);
  });
});
