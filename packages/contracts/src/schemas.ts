import { z } from 'zod';

import {
  MAX_PRIORITY,
  MAX_RANDOM_SEED,
  MAX_SCENARIO_TASKS,
  MAX_WORKERS,
  MIN_PRIORITY,
  VIRTUAL_TIME_UNIT,
} from './model.js';

const IdentifierSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const VirtualTimeSchema = z.number().int().nonnegative().safe();
const PrioritySchema = z.number().int().min(MIN_PRIORITY).max(MAX_PRIORITY);

export const PolicyIdSchema = z.enum([
  'fifo',
  'strict-priority',
  'priority-aging',
]);

export const PolicyConfigurationSchema = z.discriminatedUnion('id', [
  z.strictObject({ id: z.literal('fifo') }),
  z.strictObject({ id: z.literal('strict-priority') }),
  z.strictObject({
    id: z.literal('priority-aging'),
    agingInterval: z.number().int().positive().safe(),
  }),
]);

export const TaskDefinitionSchema = z.strictObject({
  id: IdentifierSchema,
  sequence: z.number().int().nonnegative().safe(),
  type: z.string().trim().min(1).max(50),
  arrivalTime: VirtualTimeSchema,
  serviceDuration: VirtualTimeSchema,
  initialPriority: PrioritySchema,
});

export const WorkerConfigSchema = z.strictObject({
  count: z.number().int().min(1).max(MAX_WORKERS),
});

const GenerationParameterValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
]);

export const ScenarioSourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('manual') }),
  z.strictObject({
    kind: z.literal('generated'),
    seed: z.number().int().min(0).max(MAX_RANDOM_SEED),
    parameters: z.record(z.string(), GenerationParameterValueSchema),
  }),
]);

export const ScenarioSchema = z
  .strictObject({
    id: IdentifierSchema,
    name: z.string().trim().min(1).max(120),
    timeUnit: z.literal(VIRTUAL_TIME_UNIT),
    workers: WorkerConfigSchema,
    tasks: z.array(TaskDefinitionSchema).max(MAX_SCENARIO_TASKS),
    source: ScenarioSourceSchema,
    createdAt: z.string().datetime({ offset: true }),
  })
  .superRefine((scenario, context) => {
    const taskIds = new Set<string>();
    const sequences = new Set<number>();

    scenario.tasks.forEach((task, index) => {
      if (taskIds.has(task.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate task id: ${task.id}`,
          path: ['tasks', index, 'id'],
        });
      }
      taskIds.add(task.id);

      if (sequences.has(task.sequence)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate task sequence: ${task.sequence}`,
          path: ['tasks', index, 'sequence'],
        });
      }
      sequences.add(task.sequence);
    });
  });

export const RunInputSchema = z.strictObject({
  runId: IdentifierSchema,
  scenario: ScenarioSchema,
  policy: PolicyConfigurationSchema,
  engineVersion: z.string().trim().min(1).max(50),
});

export const TaskResultSchema = z
  .strictObject({
    taskId: IdentifierSchema,
    workerId: IdentifierSchema,
    initialPriority: PrioritySchema,
    arrivalTime: VirtualTimeSchema,
    serviceStartTime: VirtualTimeSchema,
    completionTime: VirtualTimeSchema,
    waitingTime: VirtualTimeSchema,
    turnaroundTime: VirtualTimeSchema,
  })
  .superRefine((result, context) => {
    const checks: ReadonlyArray<{
      valid: boolean;
      message: string;
      path:
        | 'serviceStartTime'
        | 'completionTime'
        | 'waitingTime'
        | 'turnaroundTime';
    }> = [
      {
        valid: result.serviceStartTime >= result.arrivalTime,
        message: 'A task cannot start before it arrives',
        path: 'serviceStartTime',
      },
      {
        valid: result.completionTime >= result.serviceStartTime,
        message: 'A task cannot complete before it starts',
        path: 'completionTime',
      },
      {
        valid:
          result.waitingTime === result.serviceStartTime - result.arrivalTime,
        message: 'Waiting time must equal service start minus arrival',
        path: 'waitingTime',
      },
      {
        valid:
          result.turnaroundTime === result.completionTime - result.arrivalTime,
        message: 'Turnaround time must equal completion minus arrival',
        path: 'turnaroundTime',
      },
    ];

    checks.forEach((check) => {
      if (!check.valid) {
        context.addIssue({
          code: 'custom',
          message: check.message,
          path: [check.path],
        });
      }
    });
  });

const NullableMetricValueSchema = z.number().finite().nonnegative().nullable();

export const StatisticalSummarySchema = z
  .strictObject({
    sampleSize: z.number().int().nonnegative().safe(),
    mean: NullableMetricValueSchema,
    median: NullableMetricValueSchema,
    p95: NullableMetricValueSchema,
    maximum: NullableMetricValueSchema,
  })
  .superRefine((summary, context) => {
    const values = [summary.mean, summary.median, summary.p95, summary.maximum];
    const mustBeNull = summary.sampleSize === 0;
    const isConsistent = mustBeNull
      ? values.every((value) => value === null)
      : values.every((value) => value !== null);

    if (!isConsistent) {
      context.addIssue({
        code: 'custom',
        message:
          'Summary values must be null only when the sample size is zero',
      });
    }
  });

export const PriorityMetricsSchema = z.strictObject({
  initialPriority: PrioritySchema,
  completedTaskCount: z.number().int().nonnegative().safe(),
  waitingTime: StatisticalSummarySchema,
  turnaroundTime: StatisticalSummarySchema,
});

export const RunMetricsSchema = z
  .strictObject({
    completedTaskCount: z.number().int().nonnegative().safe(),
    simulationSpan: VirtualTimeSchema,
    throughput: NullableMetricValueSchema,
    workerUtilization: z.number().min(0).max(1).nullable(),
    waitingTime: StatisticalSummarySchema,
    turnaroundTime: StatisticalSummarySchema,
    byInitialPriority: z.array(PriorityMetricsSchema),
  })
  .superRefine((metrics, context) => {
    const hasZeroSpan = metrics.simulationSpan === 0;
    const ratesAreNull =
      metrics.throughput === null && metrics.workerUtilization === null;
    const ratesAreDefined =
      metrics.throughput !== null && metrics.workerUtilization !== null;

    if ((hasZeroSpan && !ratesAreNull) || (!hasZeroSpan && !ratesAreDefined)) {
      context.addIssue({
        code: 'custom',
        message:
          'Throughput and utilization must be null exactly when the simulation span is zero',
      });
    }

    if (
      metrics.waitingTime.sampleSize !== metrics.completedTaskCount ||
      metrics.turnaroundTime.sampleSize !== metrics.completedTaskCount
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Metric sample sizes must match the completed task count',
      });
    }

    const groupedTaskCount = metrics.byInitialPriority.reduce(
      (total, group) => total + group.completedTaskCount,
      0,
    );
    if (groupedTaskCount !== metrics.completedTaskCount) {
      context.addIssue({
        code: 'custom',
        message: 'Priority group counts must cover every completed task',
        path: ['byInitialPriority'],
      });
    }
  });

export const RunResultSchema = z
  .strictObject({
    runId: IdentifierSchema,
    scenarioId: IdentifierSchema,
    policy: PolicyConfigurationSchema,
    engineVersion: z.string().trim().min(1).max(50),
    taskResults: z.array(TaskResultSchema),
    metrics: RunMetricsSchema,
  })
  .superRefine((run, context) => {
    if (run.taskResults.length !== run.metrics.completedTaskCount) {
      context.addIssue({
        code: 'custom',
        message: 'Completed task count must match the number of task results',
        path: ['metrics', 'completedTaskCount'],
      });
    }
  });

export const ComparisonResultSchema = z
  .strictObject({
    comparisonId: IdentifierSchema,
    scenarioSnapshot: ScenarioSchema,
    runs: z.array(RunResultSchema).min(2),
    createdAt: z.string().datetime({ offset: true }),
  })
  .superRefine((comparison, context) => {
    const policyIds = new Set<string>();

    comparison.runs.forEach((run, index) => {
      if (run.scenarioId !== comparison.scenarioSnapshot.id) {
        context.addIssue({
          code: 'custom',
          message: 'Every run must use the comparison scenario snapshot',
          path: ['runs', index, 'scenarioId'],
        });
      }

      if (policyIds.has(run.policy.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate policy run: ${run.policy.id}`,
          path: ['runs', index, 'policy', 'id'],
        });
      }
      policyIds.add(run.policy.id);
    });
  });
