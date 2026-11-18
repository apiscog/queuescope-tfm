import type { PolicyConfiguration, TaskResult } from '@queuescope/contracts';

export interface EngineRunResult {
  readonly runId: string;
  readonly scenarioId: string;
  readonly policy: PolicyConfiguration;
  readonly engineVersion: string;
  readonly taskResults: readonly TaskResult[];
}
