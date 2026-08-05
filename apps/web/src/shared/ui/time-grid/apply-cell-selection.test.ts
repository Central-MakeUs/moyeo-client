import { describe, it, expect } from 'vitest';

import { applyCellSelection } from './apply-cell-selection';

const AT_18 = '2026-07-10 18:00';
const AT_19 = '2026-07-10 19:00';
const AT_20 = '2026-07-10 20:00';

describe('applyCellSelection', () => {
  it("should return ['2026-07-10 18:00','2026-07-10 19:00'] when selecting 19:00 given value has 18:00", () => {
    expect(applyCellSelection({ value: [AT_18], targets: [AT_19], mode: 'select' })).toEqual([
      AT_18,
      AT_19,
    ]);
  });

  it("should return ['2026-07-10 19:00'] when deselecting 18:00 given value has 18:00 and 19:00", () => {
    expect(
      applyCellSelection({ value: [AT_18, AT_19], targets: [AT_18], mode: 'deselect' })
    ).toEqual([AT_19]);
  });

  it('should return keys in ascending order when targets are given out of order', () => {
    expect(
      applyCellSelection({ value: [], targets: [AT_20, AT_18, AT_19], mode: 'select' })
    ).toEqual([AT_18, AT_19, AT_20]);
  });

  it('should not duplicate when selecting a key already in value', () => {
    expect(applyCellSelection({ value: [AT_18], targets: [AT_18], mode: 'select' })).toEqual([
      AT_18,
    ]);
  });

  it('should return the same keys when targets is []', () => {
    expect(applyCellSelection({ value: [AT_18, AT_19], targets: [], mode: 'select' })).toEqual([
      AT_18,
      AT_19,
    ]);
  });

  it('should return [] when deselecting every key in value', () => {
    expect(
      applyCellSelection({ value: [AT_18, AT_19], targets: [AT_18, AT_19], mode: 'deselect' })
    ).toEqual([]);
  });

  it('should exclude a disabled key when selecting it together with an enabled key', () => {
    expect(
      applyCellSelection({
        value: [],
        targets: [AT_18, AT_19],
        mode: 'select',
        disabledKeys: new Set([AT_18]),
      })
    ).toEqual([AT_19]);
  });

  it('should keep a disabled key untouched when deselecting it', () => {
    expect(
      applyCellSelection({
        value: [AT_18, AT_19],
        targets: [AT_18, AT_19],
        mode: 'deselect',
        disabledKeys: new Set([AT_18]),
      })
    ).toEqual([AT_18]);
  });
});
