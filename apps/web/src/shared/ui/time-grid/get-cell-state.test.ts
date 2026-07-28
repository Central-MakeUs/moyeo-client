import { describe, it, expect } from 'vitest';

import { getCellState } from './get-cell-state';

const KEY = '2026-07-10 18:00';

describe('getCellState', () => {
  it("should return 'default' when key is neither selected nor disabled", () => {
    expect(getCellState(KEY, new Set(), new Set())).toBe('default');
  });

  it("should return 'selected' when key is in selected", () => {
    expect(getCellState(KEY, new Set([KEY]), new Set())).toBe('selected');
  });

  it("should return 'disabled' when key is in disabled", () => {
    expect(getCellState(KEY, new Set(), new Set([KEY]))).toBe('disabled');
  });

  it("should return 'disabled' when key is in both selected and disabled (priority)", () => {
    expect(getCellState(KEY, new Set([KEY]), new Set([KEY]))).toBe('disabled');
  });
});
