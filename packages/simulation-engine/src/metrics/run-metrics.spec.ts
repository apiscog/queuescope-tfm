import { readFileSync } from 'node:fs';

import {
  RunResultSchema,
  ScenarioSchema,
  type Scenario,
  type TaskResult,
} from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { calculateRunMetrics } from './run-metrics.js';

function readJsonFixture(relativePath: string): unknown {
  return JSON.parse(
    readFileSync(new URL(relativePath, import.meta.url), 'utf8'),
  ) as unknown;
}

function createEmptyScenario(): Scenario {
  return {
    id: 'scenario-empty',
    name: 'Escenari buit',
    timeUnit: 'tick',
    workers: { count: 1 },
    tasks: [],
    source: { kind: 'manual' },
    createdAt: '2026-11-18T20:00:00.000Z',
  };
}

describe('calculateRunMetrics', () => {
  it('matches the manually calculated FIFO metrics', () => {
    const scenario = ScenarioSchema.parse(
      readJsonFixture('../../../../docs/examples/manual-scenario.json'),
    );
    const expectedRun = RunResultSchema.parse(
      readJsonFixture('../../../../docs/examples/manual-fifo-result.json'),
    );

    expect(calculateRunMetrics(scenario, expectedRun.taskResults)).toEqual(
      expectedRun.metrics,
    );
  });

  it('handles an empty scenario explicitly', () => {
    expect(calculateRunMetrics(createEmptyScenario(), [])).toEqual({
      completedTaskCount: 0,
      simulationSpan: 0,
      throughput: null,
      workerUtilization: null,
      waitingTime: {
        sampleSize: 0,
        mean: null,
        median: null,
        p95: null,
        maximum: null,
      },
      turnaroundTime: {
        sampleSize: 0,
        mean: null,
        median: null,
        p95: null,
        maximum: null,
      },
      byInitialPriority: [],
    });
  });

  it('returns null rates when no virtual time elapses', () => {
    const scenario: Scenario = {
      ...createEmptyScenario(),
      id: 'scenario-zero-span',
      tasks: [
        {
          id: 'task-a',
          sequence: 0,
          type: 'test',
          arrivalTime: 0,
          serviceDuration: 0,
          initialPriority: 1,
        },
      ],
    };
    const result: TaskResult = {
      taskId: 'task-a',
      workerId: 'worker-1',
      initialPriority: 1,
      arrivalTime: 0,
      serviceStartTime: 0,
      completionTime: 0,
      waitingTime: 0,
      turnaroundTime: 0,
    };

    expect(calculateRunMetrics(scenario, [result])).toEqual(
      expect.objectContaining({
        completedTaskCount: 1,
        simulationSpan: 0,
        throughput: null,
        workerUtilization: null,
      }),
    );
  });

  it('calculates utilization with multiple workers', () => {
    const scenario: Scenario = {
      ...createEmptyScenario(),
      id: 'scenario-two-workers',
      workers: { count: 2 },
      tasks: [
        {
          id: 'task-a',
          sequence: 0,
          type: 'test',
          arrivalTime: 0,
          serviceDuration: 4,
          initialPriority: 1,
        },
        {
          id: 'task-b',
          sequence: 1,
          type: 'test',
          arrivalTime: 0,
          serviceDuration: 2,
          initialPriority: 3,
        },
      ],
    };
    const results: TaskResult[] = [
      {
        taskId: 'task-a',
        workerId: 'worker-1',
        initialPriority: 1,
        arrivalTime: 0,
        serviceStartTime: 0,
        completionTime: 4,
        waitingTime: 0,
        turnaroundTime: 4,
      },
      {
        taskId: 'task-b',
        workerId: 'worker-2',
        initialPriority: 3,
        arrivalTime: 0,
        serviceStartTime: 0,
        completionTime: 2,
        waitingTime: 0,
        turnaroundTime: 2,
      },
    ];

    const metrics = calculateRunMetrics(scenario, results);

    expect(metrics.workerUtilization).toBe(0.75);
    expect(metrics.throughput).toBe(0.5);
    expect(
      metrics.byInitialPriority.map((group) => group.initialPriority),
    ).toEqual([1, 3]);
  });

  it('rejects missing, duplicate, unknown or inconsistent task results', () => {
    const scenario: Scenario = {
      ...createEmptyScenario(),
      tasks: [
        {
          id: 'task-a',
          sequence: 0,
          type: 'test',
          arrivalTime: 0,
          serviceDuration: 2,
          initialPriority: 1,
        },
      ],
    };
    const validResult: TaskResult = {
      taskId: 'task-a',
      workerId: 'worker-1',
      initialPriority: 1,
      arrivalTime: 0,
      serviceStartTime: 0,
      completionTime: 2,
      waitingTime: 0,
      turnaroundTime: 2,
    };

    expect(() => calculateRunMetrics(scenario, [])).toThrow();
    expect(() =>
      calculateRunMetrics(scenario, [validResult, validResult]),
    ).toThrow();
    expect(() =>
      calculateRunMetrics(scenario, [
        { ...validResult, taskId: 'task-unknown' },
      ]),
    ).toThrow();
    expect(() =>
      calculateRunMetrics(scenario, [
        { ...validResult, completionTime: 1, turnaroundTime: 1 },
      ]),
    ).toThrow();
  });
});
