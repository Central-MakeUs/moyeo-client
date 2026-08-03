import { describe, expect, it } from 'vitest';

import { getGuestEntryNextPath } from './guest-entry-next-path';

describe('getGuestEntryNextPath', () => {
  it("NEW_GUEST이고 planningType이 'SCHEDULE_ONLY'면 '/i/ABC123/respond/schedule'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_ONLY', 'NEW_GUEST')).toBe(
      '/i/ABC123/respond/schedule'
    );
  });

  it("NEW_GUEST이고 planningType이 'SCHEDULE_AND_PLACE'면 '/i/ABC123/respond/schedule'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_AND_PLACE', 'NEW_GUEST')).toBe(
      '/i/ABC123/respond/schedule'
    );
  });

  it("NEW_GUEST이고 planningType이 'PLACE_ONLY'면 '/i/ABC123/respond/departure'를 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'PLACE_ONLY', 'NEW_GUEST')).toBe(
      '/i/ABC123/respond/departure'
    );
  });

  it("EXISTING_GUEST면 planningType 3종 모두 '/meetings?code=ABC123'을 반환한다", () => {
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_ONLY', 'EXISTING_GUEST')).toBe(
      '/meetings?code=ABC123'
    );
    expect(getGuestEntryNextPath('ABC123', 'PLACE_ONLY', 'EXISTING_GUEST')).toBe(
      '/meetings?code=ABC123'
    );
    expect(getGuestEntryNextPath('ABC123', 'SCHEDULE_AND_PLACE', 'EXISTING_GUEST')).toBe(
      '/meetings?code=ABC123'
    );
  });
});
