import type { z } from 'zod';

import type {
  ComparisonResultSchema,
  PolicyConfigurationSchema,
  PolicyIdSchema,
  PriorityMetricsSchema,
  RunInputSchema,
  RunMetricsSchema,
  RunResultSchema,
  ScenarioSchema,
  ScenarioSourceSchema,
  StatisticalSummarySchema,
  TaskDefinitionSchema,
  TaskResultSchema,
  WorkerConfigSchema,
} from './schemas.js';

export const VIRTUAL_TIME_UNIT = 'tick' as const;
export const MIN_PRIORITY = 0;
export const MAX_PRIORITY = 9;
export const MAX_SCENARIO_TASKS = 1_000;
export const MAX_WORKERS = 64;
export const MAX_RANDOM_SEED = 4_294_967_295;

export type VirtualTimeUnit = typeof VIRTUAL_TIME_UNIT;
export type PolicyId = z.infer<typeof PolicyIdSchema>;
export type PolicyConfiguration = z.infer<typeof PolicyConfigurationSchema>;
export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;
export type WorkerConfig = z.infer<typeof WorkerConfigSchema>;
export type ScenarioSource = z.infer<typeof ScenarioSourceSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type RunInput = z.infer<typeof RunInputSchema>;
export type TaskResult = z.infer<typeof TaskResultSchema>;
export type StatisticalSummary = z.infer<typeof StatisticalSummarySchema>;
export type PriorityMetrics = z.infer<typeof PriorityMetricsSchema>;
export type RunMetrics = z.infer<typeof RunMetricsSchema>;
export type RunResult = z.infer<typeof RunResultSchema>;
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
