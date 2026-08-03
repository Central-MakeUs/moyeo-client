import { describe, expect, it } from 'vitest';

import { toGuestEntryType } from './to-guest-entry-type';

describe('toGuestEntryType', () => {
  it("{ entryType: 'NEW_GUEST' }를 넘기면 'NEW_GUEST'를 반환한다", () => {
    expect(toGuestEntryType({ entryType: 'NEW_GUEST' })).toBe('NEW_GUEST');
  });

  it("{ entryType: 'EXISTING_GUEST' }를 넘기면 'EXISTING_GUEST'를 반환한다", () => {
    expect(toGuestEntryType({ entryType: 'EXISTING_GUEST' })).toBe('EXISTING_GUEST');
  });

  it('아는 entryType이 아니면 null을 반환한다', () => {
    expect(toGuestEntryType({})).toBeNull();
    expect(toGuestEntryType(null)).toBeNull();
    expect(toGuestEntryType('NEW_GUEST')).toBeNull();
    expect(toGuestEntryType({ entryType: 'UNKNOWN' })).toBeNull();
  });
});
