import type { PolicyConfiguration } from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { AgingPolicy } from './aging-policy.js';
import { FifoPolicy } from './fifo-policy.js';
import { createSchedulingPolicy } from './policy-factory.js';
import { StrictPriorityPolicy } from './strict-priority-policy.js';

describe('createSchedulingPolicy', () => {
  it('creates every supported policy from its configuration', () => {
    expect(createSchedulingPolicy({ id: 'fifo' })).toBeInstanceOf(FifoPolicy);
    expect(createSchedulingPolicy({ id: 'strict-priority' })).toBeInstanceOf(
      StrictPriorityPolicy,
    );
    const agingPolicy = createSchedulingPolicy({
      id: 'priority-aging',
      agingInterval: 3,
    });
    expect(agingPolicy).toBeInstanceOf(AgingPolicy);
    expect(agingPolicy.configuration).toEqual({
      id: 'priority-aging',
      agingInterval: 3,
    });
  });

  it('rejects an invalid policy configuration at runtime', () => {
    const invalidConfiguration = {
      id: 'priority-aging',
      agingInterval: 0,
    } as PolicyConfiguration;

    expect(() => createSchedulingPolicy(invalidConfiguration)).toThrow();
  });
});
