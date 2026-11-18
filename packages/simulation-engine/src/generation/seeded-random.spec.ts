import { describe, expect, it } from 'vitest';

import { SeededRandom } from './seeded-random.js';

describe('SeededRandom', () => {
  it('produces a stable sequence for a known seed', () => {
    const random = new SeededRandom(1);

    expect([random.next(), random.next(), random.next()]).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });

  it('produces inclusive integers inside the requested range', () => {
    const random = new SeededRandom(42);
    const values = Array.from({ length: 100 }, () => random.nextInteger(3, 7));

    expect(values.every((value) => value >= 3 && value <= 7)).toBe(true);
    expect(new Set(values)).toEqual(new Set([3, 4, 5, 6, 7]));
  });

  it.each([-1, 1.5, 4_294_967_296])('rejects invalid seed %s', (seed) => {
    expect(() => new SeededRandom(seed)).toThrow(RangeError);
  });

  it('rejects invalid or excessively wide integer ranges', () => {
    const random = new SeededRandom(1);

    expect(() => random.nextInteger(2, 1)).toThrow(RangeError);
    expect(() => random.nextInteger(0, 4_294_967_296)).toThrow(RangeError);
  });
});
