export type { EngineRunResult } from './domain/engine-run-result.js';
export {
  AgingPolicy,
  calculateEffectivePriority,
} from './policies/aging-policy.js';
export { FifoPolicy } from './policies/fifo-policy.js';
export { createSchedulingPolicy } from './policies/policy-factory.js';
export type {
  SchedulingContext,
  SchedulingPolicy,
} from './policies/scheduling-policy.js';
export { StrictPriorityPolicy } from './policies/strict-priority-policy.js';
export { SimulationEngine } from './simulation/simulation-engine.js';

import { RunInputSchema, type RunInput } from '@queuescope/contracts';

import type { EngineRunResult } from './domain/engine-run-result.js';
import { createSchedulingPolicy } from './policies/policy-factory.js';
import { SimulationEngine } from './simulation/simulation-engine.js';

export const SIMULATION_ENGINE_VERSION = '0.2.0';

export function runSimulation(input: RunInput): EngineRunResult {
  return new SimulationEngine().run(
    input,
    createSchedulingPolicy(input.policy),
  );
}

export function runFifoSimulation(input: RunInput): EngineRunResult {
  const validatedInput = RunInputSchema.parse(input);
  if (validatedInput.policy.id !== 'fifo') {
    throw new Error('runFifoSimulation requires the FIFO policy');
  }
  return runSimulation(validatedInput);
}
