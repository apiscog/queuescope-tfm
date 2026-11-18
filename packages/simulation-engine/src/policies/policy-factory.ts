import {
  PolicyConfigurationSchema,
  type PolicyConfiguration,
} from '@queuescope/contracts';

import { AgingPolicy } from './aging-policy.js';
import { FifoPolicy } from './fifo-policy.js';
import type { SchedulingPolicy } from './scheduling-policy.js';
import { StrictPriorityPolicy } from './strict-priority-policy.js';

function assertNever(value: never): never {
  throw new Error(`Unsupported policy configuration: ${JSON.stringify(value)}`);
}

export function createSchedulingPolicy(
  configuration: PolicyConfiguration,
): SchedulingPolicy {
  const validatedConfiguration = PolicyConfigurationSchema.parse(configuration);

  switch (validatedConfiguration.id) {
    case 'fifo':
      return new FifoPolicy();
    case 'strict-priority':
      return new StrictPriorityPolicy();
    case 'priority-aging':
      return new AgingPolicy(validatedConfiguration.agingInterval);
    default:
      return assertNever(validatedConfiguration);
  }
}
