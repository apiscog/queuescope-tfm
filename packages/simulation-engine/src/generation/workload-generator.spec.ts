import type { GenerateScenarioInput } from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { generateScenario } from './workload-generator.js';

function createInput(seed = 12_345): GenerateScenarioInput {
  return {
    id: 'scenario-generated-001',
    name: 'Escenari sintètic reproduïble',
    createdAt: '2026-11-18T20:00:00.000Z',
    parameters: {
      taskCount: 50,
      workerCount: 3,
      arrivalTimeRange: { minimum: 0, maximum: 30 },
      serviceDurationRange: { minimum: 1, maximum: 8 },
      priorityRange: { minimum: 0, maximum: 5 },
      taskTypes: ['email', 'report', 'notification'],
      seed,
    },
  };
}

describe('generateScenario', () => {
  it('replays the same ordered workload with the same seed', () => {
    const input = createInput();

    expect(generateScenario(input)).toEqual(generateScenario(input));
  });

  it('usually changes the workload when the seed changes', () => {
    const firstScenario = generateScenario(createInput(1));
    const secondScenario = generateScenario(createInput(2));

    expect(firstScenario.tasks).not.toEqual(secondScenario.tasks);
  });

  it('keeps every generated value within the validated bounds', () => {
    const input = createInput();
    const scenario = generateScenario(input);

    expect(scenario.workers.count).toBe(input.parameters.workerCount);
    expect(scenario.tasks).toHaveLength(input.parameters.taskCount);
    for (const task of scenario.tasks) {
      expect(task.arrivalTime).toBeGreaterThanOrEqual(0);
      expect(task.arrivalTime).toBeLessThanOrEqual(30);
      expect(task.serviceDuration).toBeGreaterThanOrEqual(1);
      expect(task.serviceDuration).toBeLessThanOrEqual(8);
      expect(task.initialPriority).toBeGreaterThanOrEqual(0);
      expect(task.initialPriority).toBeLessThanOrEqual(5);
      expect(input.parameters.taskTypes).toContain(task.type);
    }
  });

  it('creates unique identifiers and a stable ordered sequence', () => {
    const scenario = generateScenario(createInput());
    const identifiers = scenario.tasks.map((task) => task.id);

    expect(new Set(identifiers).size).toBe(scenario.tasks.length);
    expect(scenario.tasks.map((task) => task.sequence)).toEqual(
      Array.from({ length: scenario.tasks.length }, (_, index) => index),
    );
    for (let index = 1; index < scenario.tasks.length; index += 1) {
      const previousTask = scenario.tasks[index - 1];
      const currentTask = scenario.tasks[index];
      expect(previousTask).toBeDefined();
      expect(currentTask).toBeDefined();
      expect(previousTask?.arrivalTime).toBeLessThanOrEqual(
        currentTask?.arrivalTime ?? -1,
      );
    }
  });

  it('supports an empty generated workload', () => {
    const input = createInput();
    input.parameters.taskCount = 0;

    expect(generateScenario(input).tasks).toEqual([]);
  });

  it('does not mutate the generation input', () => {
    const input = createInput();
    const originalInput = structuredClone(input);

    generateScenario(input);

    expect(input).toEqual(originalInput);
  });

  it('rejects invalid generation parameters', () => {
    const input = createInput();
    input.parameters.taskTypes = [];

    expect(() => generateScenario(input)).toThrow();
  });
});
