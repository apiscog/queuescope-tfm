import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  CreateComparisonInputSchema,
  GenerateScenarioInputSchema,
  PolicyConfigurationSchema,
  RunMetricsSchema,
  RunResultSchema,
  ScenarioSchema,
  StatisticalSummarySchema,
  TaskResultSchema,
} from './schemas.js';

describe('CreateComparisonInputSchema', () => {
  const validInput = {
    scenarioId: 'escenari-demo-1',
    policies: [{ id: 'fifo' }, { id: 'strict-priority' }],
  };

  it('requires at least two distinct supported policies', () => {
    expect(CreateComparisonInputSchema.safeParse(validInput).success).toBe(
      true,
    );
    expect(
      CreateComparisonInputSchema.safeParse({
        ...validInput,
        policies: [{ id: 'fifo' }],
      }).success,
    ).toBe(false);
    expect(
      CreateComparisonInputSchema.safeParse({
        ...validInput,
        policies: [{ id: 'fifo' }, { id: 'fifo' }],
      }).success,
    ).toBe(false);
  });

  it('requires an aging interval when aging is selected', () => {
    expect(
      CreateComparisonInputSchema.safeParse({
        ...validInput,
        policies: [{ id: 'fifo' }, { id: 'priority-aging' }],
      }).success,
    ).toBe(false);
  });
});

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

describe('GenerateScenarioInputSchema', () => {
  const validInput = {
    id: 'scenario-generated-001',
    name: 'Escenari generat',
    createdAt: '2026-11-18T20:00:00.000Z',
    parameters: {
      taskCount: 20,
      workerCount: 3,
      arrivalTimeRange: { minimum: 0, maximum: 30 },
      serviceDurationRange: { minimum: 1, maximum: 8 },
      priorityRange: { minimum: 0, maximum: 5 },
      taskTypes: ['email', 'report'],
      seed: 12_345,
    },
  };

  it('accepts bounded generation parameters', () => {
    expect(GenerateScenarioInputSchema.parse(validInput)).toEqual(validInput);
  });

  it('rejects inverted ranges', () => {
    const invalidInput = {
      ...validInput,
      parameters: {
        ...validInput.parameters,
        arrivalTimeRange: { minimum: 5, maximum: 4 },
      },
    };

    expect(GenerateScenarioInputSchema.safeParse(invalidInput).success).toBe(
      false,
    );
  });

  it('rejects duplicate or empty task types', () => {
    for (const taskTypes of [['email', 'email'], []]) {
      const result = GenerateScenarioInputSchema.safeParse({
        ...validInput,
        parameters: { ...validInput.parameters, taskTypes },
      });
      expect(result.success).toBe(false);
    }
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
