import type {
  PolicyConfiguration,
  RunInput,
  Scenario,
  TaskDefinition,
  TaskResult,
} from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { AgingPolicy, runSimulation, SimulationEngine } from '../index.js';

function createTask(
  id: string,
  sequence: number,
  arrivalTime: number,
  serviceDuration: number,
  initialPriority: number,
): TaskDefinition {
  return {
    id,
    sequence,
    type: 'test',
    arrivalTime,
    serviceDuration,
    initialPriority,
  };
}

function createScenario(): Scenario {
  return {
    id: 'scenario-policy-comparison',
    name: 'Escenari controlat de polítiques',
    timeUnit: 'tick',
    workers: { count: 1 },
    tasks: [
      createTask('task-blocker', 0, 0, 10, 9),
      createTask('task-old-low', 1, 0, 2, 1),
      createTask('task-recent-high', 2, 9, 1, 3),
    ],
    source: { kind: 'manual' },
    createdAt: '2026-11-18T12:00:00.000Z',
  };
}

function runPolicy(
  scenario: Scenario,
  policy: PolicyConfiguration,
): readonly TaskResult[] {
  const input: RunInput = {
    runId: `run-${policy.id}`,
    scenario,
    policy,
    engineVersion: '0.2.0-test',
  };

  return runSimulation(input).taskResults;
}

function executionOrder(results: readonly TaskResult[]): readonly string[] {
  return results
    .toSorted(
      (left, right) =>
        left.serviceStartTime - right.serviceStartTime ||
        left.taskId.localeCompare(right.taskId),
    )
    .map((result) => result.taskId);
}

describe('interchangeable scheduling policies', () => {
  it('strict priority lets an urgent pending task overtake a lower priority task', () => {
    const results = runPolicy(createScenario(), { id: 'strict-priority' });

    expect(executionOrder(results)).toEqual([
      'task-blocker',
      'task-recent-high',
      'task-old-low',
    ]);
  });

  it('does not interrupt a task that has already started', () => {
    const results = runPolicy(createScenario(), { id: 'strict-priority' });
    const blocker = results.find((result) => result.taskId === 'task-blocker');
    const urgentTask = results.find(
      (result) => result.taskId === 'task-recent-high',
    );

    expect(blocker?.serviceStartTime).toBe(0);
    expect(blocker?.completionTime).toBe(10);
    expect(urgentTask?.serviceStartTime).toBe(10);
  });

  it('aging changes the controlled decision after enough waiting time', () => {
    const results = runPolicy(createScenario(), {
      id: 'priority-aging',
      agingInterval: 2,
    });

    expect(executionOrder(results)).toEqual([
      'task-blocker',
      'task-old-low',
      'task-recent-high',
    ]);
  });

  it('runs every policy against the same immutable scenario', () => {
    const scenario = createScenario();
    const originalScenario = structuredClone(scenario);
    const policies: readonly PolicyConfiguration[] = [
      { id: 'fifo' },
      { id: 'strict-priority' },
      { id: 'priority-aging', agingInterval: 2 },
    ];

    const firstResults = policies.map((policy) => runPolicy(scenario, policy));
    const secondResults = policies.map((policy) => runPolicy(scenario, policy));

    expect(firstResults).toEqual(secondResults);
    expect(scenario).toEqual(originalScenario);
  });

  it('records the selected policy and its parameters in the result', () => {
    const scenario = createScenario();
    const input: RunInput = {
      runId: 'run-aging',
      scenario,
      policy: { id: 'priority-aging', agingInterval: 2 },
      engineVersion: '0.2.0-test',
    };

    expect(runSimulation(input).policy).toEqual(input.policy);
  });

  it('rejects an implementation with different aging parameters', () => {
    const input: RunInput = {
      runId: 'run-aging-mismatch',
      scenario: createScenario(),
      policy: { id: 'priority-aging', agingInterval: 5 },
      engineVersion: '0.2.0-test',
    };

    expect(() => new SimulationEngine().run(input, new AgingPolicy(2))).toThrow(
      'does not match',
    );
  });
});
