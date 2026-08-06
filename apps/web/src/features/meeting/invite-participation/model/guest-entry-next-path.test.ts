import { describe, expect, it } from 'vitest';

import { getGuestEntryNextPath } from './guest-entry-next-path';

describe('getGuestEntryNextPath', () => {
  it("NEW_GUEST이고 planningType이 'SCHEDULE_ONLY'면 '/i/ABC123/respond/schedule'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_ONLY', 'NEW_GUEST', false)).toBe(
      '/i/ABC123/respond/schedule'
    );
  });

  it("NEW_GUEST이고 planningType이 'SCHEDULE_AND_PLACE'면 '/i/ABC123/respond/schedule'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_AND_PLACE', 'NEW_GUEST', false)).toBe(
      '/i/ABC123/respond/schedule'
    );
  });

  it("NEW_GUEST이고 planningType이 'PLACE_ONLY'면 '/i/ABC123/respond/departure'를 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'PLACE_ONLY', 'NEW_GUEST', false)).toBe(
      '/i/ABC123/respond/departure'
    );
  });

  it("확정 전 EXISTING_GUEST면 planningType 3종 모두 '/meetings?code=ABC123'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_ONLY', 'EXISTING_GUEST', false)).toBe(
      '/meetings?code=ABC123'
    );
    expect(getGuestEntryNextPath('ABC123', 'PLACE_ONLY', 'EXISTING_GUEST', false)).toBe(
      '/meetings?code=ABC123'
    );
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_AND_PLACE', 'EXISTING_GUEST', false)).toBe(
      '/meetings?code=ABC123'
    );
  });

  it("확정된 모임의 EXISTING_GUEST면 '/meetings/confirmed?code=ABC123'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_ONLY', 'EXISTING_GUEST', true)).toBe(
      '/meetings/confirmed?code=ABC123'
    );
  });

  it('확정 여부는 NEW_GUEST의 목적지를 바꾸지 않는다', () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_ONLY', 'NEW_GUEST', true)).toBe(
      '/i/ABC123/respond/schedule'
    );
  });
});
