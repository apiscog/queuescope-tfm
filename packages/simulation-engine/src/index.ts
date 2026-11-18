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

import {
  RunInputSchema,
  RunResultSchema,
  type RunInput,
  type RunResult,
} from '@queuescope/contracts';

export { generateScenario } from './generation/workload-generator.js';
export { SeededRandom } from './generation/seeded-random.js';
export { calculateRunMetrics } from './metrics/run-metrics.js';
export { calculateStatisticalSummary } from './metrics/statistical-summary.js';
import { calculateRunMetrics } from './metrics/run-metrics.js';
import { createSchedulingPolicy } from './policies/policy-factory.js';
import { SimulationEngine } from './simulation/simulation-engine.js';

export const SIMULATION_ENGINE_VERSION = '0.3.0';

export function runSimulation(input: RunInput): RunResult {
  const validatedInput = RunInputSchema.parse(input);
  const engineResult = new SimulationEngine().run(
    validatedInput,
    createSchedulingPolicy(validatedInput.policy),
  );

  return RunResultSchema.parse({
    ...engineResult,
    metrics: calculateRunMetrics(
      validatedInput.scenario,
      engineResult.taskResults,
    ),
  });
}

export function runFifoSimulation(input: RunInput): RunResult {
  const validatedInput = RunInputSchema.parse(input);
  if (validatedInput.policy.id !== 'fifo') {
    throw new Error('runFifoSimulation requires the FIFO policy');
  }
  return runSimulation(validatedInput);
}
