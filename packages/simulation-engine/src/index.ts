export type { EngineRunResult } from './domain/engine-run-result.js';
export { FifoPolicy } from './policies/fifo-policy.js';
export type {
  SchedulingContext,
  SchedulingPolicy,
} from './policies/scheduling-policy.js';
export { SimulationEngine } from './simulation/simulation-engine.js';

import type { RunInput } from '@queuescope/contracts';

import type { EngineRunResult } from './domain/engine-run-result.js';
import { FifoPolicy } from './policies/fifo-policy.js';
import { SimulationEngine } from './simulation/simulation-engine.js';

export const SIMULATION_ENGINE_VERSION = '0.1.0';

export function runFifoSimulation(input: RunInput): EngineRunResult {
  return new SimulationEngine().run(input, new FifoPolicy());
}
