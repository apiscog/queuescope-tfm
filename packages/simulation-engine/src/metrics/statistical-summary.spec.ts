import { describe, expect, it } from 'vitest';

import { calculateStatisticalSummary } from './statistical-summary.js';

describe('calculateStatisticalSummary', () => {
  it('returns explicit null values for an empty sample', () => {
    expect(calculateStatisticalSummary([])).toEqual({
      sampleSize: 0,
      mean: null,
      median: null,
      p95: null,
      maximum: null,
    });
  });

  it('calculates one observation without rounding', () => {
    expect(calculateStatisticalSummary([2.5])).toEqual({
      sampleSize: 1,
      mean: 2.5,
      median: 2.5,
      p95: 2.5,
      maximum: 2.5,
    });
  });

  it('calculates medians for odd and even samples', () => {
    expect(calculateStatisticalSummary([5, 0, 3]).median).toBe(3);
    expect(calculateStatisticalSummary([8, 0, 4, 2]).median).toBe(3);
  });

  it('uses nearest rank for p95', () => {
    const values = Array.from({ length: 20 }, (_, index) => index + 1);

    expect(calculateStatisticalSummary(values).p95).toBe(19);
  });

  it('rejects negative or non-finite samples', () => {
    expect(() => calculateStatisticalSummary([-1])).toThrow(RangeError);
    expect(() => calculateStatisticalSummary([Number.NaN])).toThrow(RangeError);
  });
});
