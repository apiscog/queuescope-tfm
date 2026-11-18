import type { TaskDefinition } from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { AgingPolicy, calculateEffectivePriority } from './aging-policy.js';

function createTask(
  id: string,
  sequence: number,
  arrivalTime: number,
  initialPriority: number,
): TaskDefinition {
  return {
    id,
    sequence,
    type: 'test',
    arrivalTime,
    serviceDuration: 1,
    initialPriority,
  };
}

describe('calculateEffectivePriority', () => {
  it('increases priority after each complete aging interval', () => {
    const task = createTask('task-a', 0, 0, 1);

    expect(calculateEffectivePriority(task, 0, 2)).toBe(1);
    expect(calculateEffectivePriority(task, 1, 2)).toBe(1);
    expect(calculateEffectivePriority(task, 2, 2)).toBe(2);
    expect(calculateEffectivePriority(task, 10, 2)).toBe(6);
  });

  it('caps effective priority at the configured maximum', () => {
    const task = createTask('task-a', 0, 0, 8);

    expect(calculateEffectivePriority(task, 100, 1)).toBe(9);
  });

  it('rejects a current time before task arrival', () => {
    const task = createTask('task-a', 0, 5, 1);

    expect(() => calculateEffectivePriority(task, 4, 2)).toThrow(RangeError);
  });
});

describe('AgingPolicy', () => {
  it('allows a sufficiently old low-priority task to overtake a recent task', () => {
    const policy = new AgingPolicy(2);
    const oldTask = createTask('task-old', 0, 0, 1);
    const recentTask = createTask('task-recent', 1, 9, 3);

    expect(
      policy.selectNextTask([recentTask, oldTask], { currentTime: 10 })?.id,
    ).toBe('task-old');
  });

  it('keeps the higher effective priority when aging is insufficient', () => {
    const policy = new AgingPolicy(10);
    const oldTask = createTask('task-old', 0, 0, 1);
    const recentTask = createTask('task-recent', 1, 9, 3);

    expect(
      policy.selectNextTask([oldTask, recentTask], { currentTime: 10 })?.id,
    ).toBe('task-recent');
  });

  it('uses FIFO when effective priorities are equal', () => {
    const policy = new AgingPolicy(2);
    const firstTask = createTask('task-first', 0, 0, 1);
    const laterTask = createTask('task-later', 1, 4, 3);

    expect(
      policy.selectNextTask([laterTask, firstTask], { currentTime: 4 })?.id,
    ).toBe('task-first');
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid aging interval %s',
    (agingInterval) => {
      expect(() => new AgingPolicy(agingInterval)).toThrow();
    },
  );

  it('does not mutate the ready tasks', () => {
    const policy = new AgingPolicy(2);
    const tasks = [
      createTask('task-a', 0, 0, 1),
      createTask('task-b', 1, 1, 4),
    ];
    const originalTasks = structuredClone(tasks);

    policy.selectNextTask(tasks, { currentTime: 4 });

    expect(tasks).toEqual(originalTasks);
  });
});
