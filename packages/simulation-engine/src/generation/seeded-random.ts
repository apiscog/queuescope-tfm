import { MAX_RANDOM_SEED } from '@queuescope/contracts';

const UINT32_RANGE_SIZE = MAX_RANDOM_SEED + 1;
const MULBERRY32_INCREMENT = 0x6d2b79f5;

export class SeededRandom {
  #state: number;

  constructor(seed: number) {
    if (!Number.isInteger(seed) || seed < 0 || seed > MAX_RANDOM_SEED) {
      throw new RangeError('Seed must be an unsigned 32-bit integer');
    }
    this.#state = seed >>> 0;
  }

  next(): number {
    this.#state = (this.#state + MULBERRY32_INCREMENT) >>> 0;
    let value = this.#state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE_SIZE;
  }

  nextInteger(minimum: number, maximum: number): number {
    if (
      !Number.isSafeInteger(minimum) ||
      !Number.isSafeInteger(maximum) ||
      minimum > maximum
    ) {
      throw new RangeError(
        'Integer range must contain safe integers with minimum <= maximum',
      );
    }

    const rangeSize = maximum - minimum + 1;
    if (rangeSize > UINT32_RANGE_SIZE) {
      throw new RangeError('Integer range cannot exceed the 32-bit PRNG space');
    }

    return minimum + Math.floor(this.next() * rangeSize);
  }
}
