import { describe, it, expect } from 'vitest';

import { computeRuns } from './compute-runs';

const d = (day: number) => new Date(2026, 6, day);

describe('computeRuns', () => {
  it('should classify 7/10=runStart, 7/11=runMiddle, 7/12=runEnd, 7/20=runSingle when given [7/10, 7/11, 7/12, 7/20]', () => {
    const result = computeRuns([d(10), d(11), d(12), d(20)]);

    expect(result.runStart).toEqual([d(10)]);
    expect(result.runMiddle).toEqual([d(11)]);
    expect(result.runEnd).toEqual([d(12)]);
    expect(result.runSingle).toEqual([d(20)]);
  });

  it('should return two separate bands (runStart=[7/10,7/20], runEnd=[7/11,7/21], runMiddle=[], runSingle=[]) when given [7/10, 7/11, 7/20, 7/21]', () => {
    const result = computeRuns([d(10), d(11), d(20), d(21)]);

    expect(result.runStart).toEqual([d(10), d(20)]);
    expect(result.runEnd).toEqual([d(11), d(21)]);
    expect(result.runMiddle).toEqual([]);
    expect(result.runSingle).toEqual([]);
  });

  it('should return 7/10 and 7/12 both in runSingle (with empty runMiddle) when given [7/10, 7/12]', () => {
    const result = computeRuns([d(10), d(12)]);

    expect(result.runSingle).toEqual([d(10), d(12)]);
    expect(result.runMiddle).toEqual([]);
    expect(result.runStart).toEqual([]);
    expect(result.runEnd).toEqual([]);
  });

  it('should classify a length-2 run as runStart=[7/10], runEnd=[7/11], runMiddle=[] when given [7/10, 7/11]', () => {
    const result = computeRuns([d(10), d(11)]);

    expect(result.runStart).toEqual([d(10)]);
    expect(result.runEnd).toEqual([d(11)]);
    expect(result.runMiddle).toEqual([]);
    expect(result.runSingle).toEqual([]);
  });

  it('should return all-empty segments when given []', () => {
    const result = computeRuns([]);

    expect(result.runStart).toEqual([]);
    expect(result.runMiddle).toEqual([]);
    expect(result.runEnd).toEqual([]);
    expect(result.runSingle).toEqual([]);
  });

  it('should classify 7/10=start, 7/11=middle, 7/12=end regardless of input order when given unsorted [7/12, 7/10, 7/11]', () => {
    const result = computeRuns([d(12), d(10), d(11)]);

    expect(result.runStart).toEqual([d(10)]);
    expect(result.runMiddle).toEqual([d(11)]);
    expect(result.runEnd).toEqual([d(12)]);
    expect(result.runSingle).toEqual([]);
  });

  it('should treat duplicate dates as one (runSingle=[7/10], 길이 1) when given [7/10, 7/10]', () => {
    const result = computeRuns([d(10), d(10)]);

    expect(result.runSingle).toEqual([d(10)]);
    expect(result.runStart).toEqual([]);
    expect(result.runMiddle).toEqual([]);
    expect(result.runEnd).toEqual([]);
  });
});
