import { describe, expect, it } from 'vitest';
import { SIMULATION_ENGINE_VERSION } from './index.js';

describe('simulation engine package', () => {
  it('exposes its initial version', () => {
    expect(SIMULATION_ENGINE_VERSION).toBe('0.0.0');
  });
});
