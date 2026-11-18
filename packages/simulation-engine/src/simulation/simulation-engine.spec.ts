import { readFileSync } from 'node:fs';

import {
  RunResultSchema,
  ScenarioSchema,
  type RunInput,
  type Scenario,
  type TaskDefinition,
  type TaskResult,
} from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { FifoPolicy } from '../policies/fifo-policy.js';
import { compareIdentifiers } from '../domain/compare-identifiers.js';
import { runFifoSimulation } from '../index.js';
import { SimulationEngine } from './simulation-engine.js';

function readJsonFixture(relativePath: string): unknown {
  return JSON.parse(
    readFileSync(new URL(relativePath, import.meta.url), 'utf8'),
  ) as unknown;
}

function createTask(
  id: string,
  sequence: number,
  arrivalTime: number,
  serviceDuration: number,
): TaskDefinition {
  return {
    id,
    sequence,
    type: 'test',
    arrivalTime,
    serviceDuration,
    initialPriority: 0,
  };
}

function createScenario(
  tasks: readonly TaskDefinition[],
  workerCount = 1,
): Scenario {
  return {
    id: 'scenario-test',
    name: 'Escenari de prova',
    timeUnit: 'tick',
    workers: { count: workerCount },
    tasks: [...tasks],
    source: { kind: 'manual' },
    createdAt: '2026-11-18T10:00:00.000Z',
  };
}

function createInput(scenario: Scenario): RunInput {
  return {
    runId: 'run-test',
    scenario,
    policy: { id: 'fifo' },
    engineVersion: '0.1.0-test',
  };
}

function runScenario(scenario: Scenario): readonly TaskResult[] {
  return new SimulationEngine().run(createInput(scenario), new FifoPolicy())
    .taskResults;
}

function expectNoWorkerOverlap(taskResults: readonly TaskResult[]): void {
  const resultsByWorker = new Map<string, TaskResult[]>();
  for (const result of taskResults) {
    const workerResults = resultsByWorker.get(result.workerId) ?? [];
    workerResults.push(result);
    resultsByWorker.set(result.workerId, workerResults);
  }

  for (const workerResults of resultsByWorker.values()) {
    const orderedResults = workerResults.toSorted(
      (left, right) =>
        left.serviceStartTime - right.serviceStartTime ||
        left.completionTime - right.completionTime ||
        compareIdentifiers(left.taskId, right.taskId),
    );

    for (let index = 1; index < orderedResults.length; index += 1) {
      const previousResult = orderedResults[index - 1];
      const currentResult = orderedResults[index];
      expect(previousResult).toBeDefined();
      expect(currentResult).toBeDefined();
      expect(currentResult?.serviceStartTime).toBeGreaterThanOrEqual(
        previousResult?.completionTime ?? Number.POSITIVE_INFINITY,
      );
    }
  }
}

describe('SimulationEngine with FIFO', () => {
  it('completes an empty scenario', () => {
    expect(runScenario(createScenario([]))).toEqual([]);
  });

  it('executes one task with one worker', () => {
    expect(
      runScenario(createScenario([createTask('task-a', 0, 2, 3)])),
    ).toEqual([
      {
        taskId: 'task-a',
        workerId: 'worker-1',
        initialPriority: 0,
        arrivalTime: 2,
        serviceStartTime: 2,
        completionTime: 5,
        waitingTime: 0,
        turnaroundTime: 3,
      },
    ]);
  });

  it('matches the manually calculated FIFO reference', () => {
    const scenario = ScenarioSchema.parse(
      readJsonFixture('../../../../docs/examples/manual-scenario.json'),
    );
    const expectedRun = RunResultSchema.parse(
      readJsonFixture('../../../../docs/examples/manual-fifo-result.json'),
    );
    const input: RunInput = {
      runId: expectedRun.runId,
      scenario,
      policy: expectedRun.policy,
      engineVersion: expectedRun.engineVersion,
    };

    const result = runFifoSimulation(input);

    expect(result).toEqual(expectedRun);
  });

  it('uses stable insertion order for simultaneous arrivals', () => {
    const scenario = createScenario([
      createTask('task-c', 2, 0, 1),
      createTask('task-a', 0, 0, 1),
      createTask('task-b', 1, 0, 1),
    ]);

    expect(
      runScenario(scenario).map((result) => ({
        taskId: result.taskId,
        serviceStartTime: result.serviceStartTime,
      })),
    ).toEqual([
      { taskId: 'task-a', serviceStartTime: 0 },
      { taskId: 'task-b', serviceStartTime: 1 },
      { taskId: 'task-c', serviceStartTime: 2 },
    ]);
  });

  it('queues excess tasks until one of the workers is available', () => {
    const results = runScenario(
      createScenario(
        [
          createTask('task-a', 0, 0, 5),
          createTask('task-b', 1, 0, 2),
          createTask('task-c', 2, 0, 1),
        ],
        2,
      ),
    );

    expect(results).toEqual([
      expect.objectContaining({
        taskId: 'task-a',
        workerId: 'worker-1',
        serviceStartTime: 0,
        completionTime: 5,
      }),
      expect.objectContaining({
        taskId: 'task-b',
        workerId: 'worker-2',
        serviceStartTime: 0,
        completionTime: 2,
      }),
      expect.objectContaining({
        taskId: 'task-c',
        workerId: 'worker-2',
        serviceStartTime: 2,
        completionTime: 3,
      }),
    ]);
    expectNoWorkerOverlap(results);
  });

  it('jumps directly to a future arrival while workers are idle', () => {
    const [result] = runScenario(
      createScenario([createTask('task-future', 0, 10_000, 4)]),
    );

    expect(result).toEqual(
      expect.objectContaining({
        arrivalTime: 10_000,
        serviceStartTime: 10_000,
        completionTime: 10_004,
      }),
    );
  });

  it('completes zero-duration tasks deterministically at the same time', () => {
    const results = runScenario(
      createScenario([
        createTask('task-a', 0, 0, 0),
        createTask('task-b', 1, 0, 0),
        createTask('task-c', 2, 0, 0),
      ]),
    );

    expect(
      results.map((result) => [
        result.taskId,
        result.serviceStartTime,
        result.completionTime,
      ]),
    ).toEqual([
      ['task-a', 0, 0],
      ['task-b', 0, 0],
      ['task-c', 0, 0],
    ]);
  });

  it('is deterministic and does not mutate the source scenario', () => {
    const scenario = createScenario(
      [
        createTask('task-a', 0, 0, 3),
        createTask('task-b', 1, 1, 2),
        createTask('task-c', 2, 1, 4),
        createTask('task-d', 3, 8, 1),
      ],
      2,
    );
    const originalScenario = structuredClone(scenario);

    const firstResult = runScenario(scenario);
    const secondResult = runScenario(scenario);

    expect(firstResult).toEqual(secondResult);
    expect(scenario).toEqual(originalScenario);
    expect(
      firstResult.every(
        (result) => result.serviceStartTime >= result.arrivalTime,
      ),
    ).toBe(true);
    expectNoWorkerOverlap(firstResult);
  });

  it('rejects a policy implementation that does not match the input', () => {
    const input: RunInput = {
      ...createInput(createScenario([])),
      policy: { id: 'strict-priority' },
    };

    expect(() => new SimulationEngine().run(input, new FifoPolicy())).toThrow(
      'does not match',
    );
  });
});
