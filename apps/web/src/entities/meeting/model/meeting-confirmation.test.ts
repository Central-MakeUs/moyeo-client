import { describe, expect, it } from 'vitest';

import { toConfirmationOutcome } from './meeting-confirmation';

describe('toConfirmationOutcome', () => {
  it('CONFIRMED면 모임 전체 확정으로 본다', () => {
    expect(toConfirmationOutcome({ status: 'CONFIRMED' })).toBe('final');
  });

  it('PLANNING이면 아직 확정할 항목이 남은 것으로 본다', () => {
    expect(toConfirmationOutcome({ status: 'PLANNING' })).toBe('partial');
  });

  it('status를 모르면 화면에 머무른다', () => {
    expect(toConfirmationOutcome({})).toBe('partial');
  });
});
