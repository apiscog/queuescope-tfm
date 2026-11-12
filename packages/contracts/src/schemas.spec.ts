import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  PolicyConfigurationSchema,
  RunMetricsSchema,
  RunResultSchema,
  ScenarioSchema,
  StatisticalSummarySchema,
  TaskResultSchema,
} from './schemas.js';

function readJsonFixture(relativePath: string): unknown {
  const fileUrl = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(fileUrl, 'utf8')) as unknown;
}

describe('ScenarioSchema', () => {
  it('accepts the manually verifiable scenario', () => {
    const scenario = readJsonFixture(
      '../../../docs/examples/manual-scenario.json',
    );

    expect(ScenarioSchema.parse(scenario)).toEqual(scenario);
  });

  it('rejects duplicate task identifiers and insertion sequences', () => {
    const scenario = ScenarioSchema.parse(
      readJsonFixture('../../../docs/examples/manual-scenario.json'),
    );
    const duplicatedScenario = {
      ...scenario,
      tasks: [...scenario.tasks, scenario.tasks[0]],
    };

    const result = ScenarioSchema.safeParse(duplicatedScenario);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.at(-1))).toEqual(
        expect.arrayContaining(['id', 'sequence']),
      );
    }
  });

  it('rejects an out-of-range priority', () => {
    const scenario = ScenarioSchema.parse(
      readJsonFixture('../../../docs/examples/manual-scenario.json'),
    );
    const invalidScenario = {
      ...scenario,
      tasks: [{ ...scenario.tasks[0], initialPriority: 10 }],
    };

    expect(ScenarioSchema.safeParse(invalidScenario).success).toBe(false);
  });
});

describe('PolicyConfigurationSchema', () => {
  it('requires a positive aging interval', () => {
    expect(
      PolicyConfigurationSchema.safeParse({
        id: 'priority-aging',
        agingInterval: 0,
      }).success,
    ).toBe(false);
  });
});

describe('TaskResultSchema', () => {
  it('rejects inconsistent derived times', () => {
    const result = TaskResultSchema.safeParse({
      taskId: 'task-a',
      workerId: 'worker-1',
      initialPriority: 1,
      arrivalTime: 2,
      serviceStartTime: 5,
      completionTime: 8,
      waitingTime: 2,
      turnaroundTime: 6,
    });

    expect(result.success).toBe(false);
  });
});

describe('RunResultSchema', () => {
  it('accepts the manually calculated FIFO result', () => {
    const result = readJsonFixture(
      '../../../docs/examples/manual-fifo-result.json',
    );

    expect(RunResultSchema.parse(result)).toEqual(result);
  });
});

describe('metric schemas', () => {
  it('requires null statistics for an empty sample', () => {
    const result = StatisticalSummarySchema.safeParse({
      sampleSize: 0,
      mean: 0,
      median: null,
      p95: null,
      maximum: null,
    });

    expect(result.success).toBe(false);
  });

  it('requires null rates when no simulated time elapses', () => {
    const emptySummary = {
      sampleSize: 0,
      mean: null,
      median: null,
      p95: null,
      maximum: null,
    };
    const result = RunMetricsSchema.safeParse({
      completedTaskCount: 0,
      simulationSpan: 0,
      throughput: 0,
      workerUtilization: 0,
      waitingTime: emptySummary,
      turnaroundTime: emptySummary,
      byInitialPriority: [],
    });

    expect(result.success).toBe(false);
  });
});
