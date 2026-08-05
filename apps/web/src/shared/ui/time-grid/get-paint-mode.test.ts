import { describe, it, expect } from 'vitest';

import { getPaintMode } from './get-paint-mode';

const AT_18 = '2026-07-10 18:00';

describe('getPaintMode', () => {
  it("should return 'select' when the anchor key is not in selected", () => {
    expect(getPaintMode(AT_18, new Set())).toBe('select');
  });

  it("should return 'deselect' when the anchor key is in selected", () => {
    expect(getPaintMode(AT_18, new Set([AT_18]))).toBe('deselect');
  });
});
