import {
  RunMetricsSchema,
  ScenarioSchema,
  TaskResultSchema,
  type RunMetrics,
  type Scenario,
  type TaskDefinition,
  type TaskResult,
} from '@queuescope/contracts';

import { calculateStatisticalSummary } from './statistical-summary.js';

function validateWorkerId(workerId: string, workerCount: number): void {
  const match = /^worker-(\d+)$/.exec(workerId);
  const workerNumber = match?.[1] === undefined ? NaN : Number(match[1]);
  if (
    !Number.isSafeInteger(workerNumber) ||
    workerNumber < 1 ||
    workerNumber > workerCount
  ) {
    throw new Error(`Unknown worker in task result: ${workerId}`);
  }
}

function validateTaskOutcome(
  task: TaskDefinition,
  result: TaskResult,
  workerCount: number,
): void {
  if (
    result.arrivalTime !== task.arrivalTime ||
    result.initialPriority !== task.initialPriority ||
    result.completionTime - result.serviceStartTime !== task.serviceDuration
  ) {
    throw new Error(`Task result does not match scenario task: ${task.id}`);
  }
  validateWorkerId(result.workerId, workerCount);
}

export function calculateRunMetrics(
  scenario: Scenario,
  taskResults: readonly TaskResult[],
): RunMetrics {
  const validatedScenario = ScenarioSchema.parse(scenario);
  const validatedResults = taskResults.map((result) =>
    TaskResultSchema.parse(result),
  );

  if (validatedResults.length !== validatedScenario.tasks.length) {
    throw new Error('Every scenario task must have exactly one task result');
  }

  const resultsByTaskId = new Map<string, TaskResult>();
  for (const result of validatedResults) {
    if (resultsByTaskId.has(result.taskId)) {
      throw new Error(`Duplicate task result: ${result.taskId}`);
    }
    resultsByTaskId.set(result.taskId, result);
  }

  for (const task of validatedScenario.tasks) {
    const result = resultsByTaskId.get(task.id);
    if (result === undefined) {
      throw new Error(`Missing task result: ${task.id}`);
    }
    validateTaskOutcome(task, result, validatedScenario.workers.count);
  }

  const waitingTimes = validatedResults.map((result) => result.waitingTime);
  const turnaroundTimes = validatedResults.map(
    (result) => result.turnaroundTime,
  );
  const completedTaskCount = validatedResults.length;
  const firstArrivalTime =
    completedTaskCount === 0
      ? 0
      : Math.min(...validatedResults.map((result) => result.arrivalTime));
  const lastCompletionTime =
    completedTaskCount === 0
      ? 0
      : Math.max(...validatedResults.map((result) => result.completionTime));
  const simulationSpan = lastCompletionTime - firstArrivalTime;
  const totalBusyWorkerTime = validatedResults.reduce(
    (total, result) =>
      total + (result.completionTime - result.serviceStartTime),
    0,
  );

  const resultsByPriority = new Map<number, TaskResult[]>();
  for (const result of validatedResults) {
    const priorityResults = resultsByPriority.get(result.initialPriority) ?? [];
    priorityResults.push(result);
    resultsByPriority.set(result.initialPriority, priorityResults);
  }

  const byInitialPriority = [...resultsByPriority.entries()]
    .toSorted(([leftPriority], [rightPriority]) => leftPriority - rightPriority)
    .map(([initialPriority, results]) => ({
      initialPriority,
      completedTaskCount: results.length,
      waitingTime: calculateStatisticalSummary(
        results.map((result) => result.waitingTime),
      ),
      turnaroundTime: calculateStatisticalSummary(
        results.map((result) => result.turnaroundTime),
      ),
    }));

  return RunMetricsSchema.parse({
    completedTaskCount,
    simulationSpan,
    throughput:
      simulationSpan === 0 ? null : completedTaskCount / simulationSpan,
    workerUtilization:
      simulationSpan === 0
        ? null
        : totalBusyWorkerTime /
          (validatedScenario.workers.count * simulationSpan),
    waitingTime: calculateStatisticalSummary(waitingTimes),
    turnaroundTime: calculateStatisticalSummary(turnaroundTimes),
    byInitialPriority,
  });
}
