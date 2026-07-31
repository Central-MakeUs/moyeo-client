import { describe, expect, it } from 'vitest';

import { computeAvatarGroupSlots } from './compute-avatar-group-slots';

describe('computeAvatarGroupSlots', () => {
  it('should return 2 empty then 3 filled with null overflow when capacity is 5 and joinedCount is 3', () => {
    const result = computeAvatarGroupSlots({ capacity: 5, joinedCount: 3 });

    expect(result).toEqual({
      slots: ['empty', 'empty', 'filled', 'filled', 'filled'],
      overflow: null,
    });
  });

  it('should return 4 empty with overflow 16 when capacity is 20 and joinedCount is 13', () => {
    const result = computeAvatarGroupSlots({ capacity: 20, joinedCount: 13 });

    expect(result).toEqual({
      slots: ['empty', 'empty', 'empty', 'empty'],
      overflow: 16,
    });
  });

  it('should return 2 empty then 2 filled with overflow 16 when capacity is 20 and joinedCount is 18', () => {
    const result = computeAvatarGroupSlots({ capacity: 20, joinedCount: 18 });

    expect(result).toEqual({
      slots: ['empty', 'empty', 'filled', 'filled'],
      overflow: 16,
    });
  });

  it('should return 5 filled with null overflow when capacity is 5 and joinedCount is 5', () => {
    const result = computeAvatarGroupSlots({ capacity: 5, joinedCount: 5 });

    expect(result).toEqual({
      slots: ['filled', 'filled', 'filled', 'filled', 'filled'],
      overflow: null,
    });
  });

  it('should return 5 empty with null overflow when capacity is 5 and joinedCount is 0', () => {
    const result = computeAvatarGroupSlots({ capacity: 5, joinedCount: 0 });

    expect(result).toEqual({
      slots: ['empty', 'empty', 'empty', 'empty', 'empty'],
      overflow: null,
    });
  });

  it('should return 4 slots with overflow 2 when capacity is 6 given 6 is the first size above the 5 threshold', () => {
    const result = computeAvatarGroupSlots({ capacity: 6, joinedCount: 0 });

    expect(result).toEqual({
      slots: ['empty', 'empty', 'empty', 'empty'],
      overflow: 2,
    });
  });

  it('should return empty slots and null overflow when capacity is 0', () => {
    const result = computeAvatarGroupSlots({ capacity: 0, joinedCount: 0 });

    expect(result).toEqual({ slots: [], overflow: null });
  });

  it('should clamp joinedCount to 0 when joinedCount is negative', () => {
    const result = computeAvatarGroupSlots({ capacity: 3, joinedCount: -5 });

    expect(result).toEqual({
      slots: ['empty', 'empty', 'empty'],
      overflow: null,
    });
  });

  it('should clamp joinedCount to capacity when joinedCount exceeds capacity', () => {
    const result = computeAvatarGroupSlots({ capacity: 3, joinedCount: 10 });

    expect(result).toEqual({
      slots: ['filled', 'filled', 'filled'],
      overflow: null,
    });
  });
});
