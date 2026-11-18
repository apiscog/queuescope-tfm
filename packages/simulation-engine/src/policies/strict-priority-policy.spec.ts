import type { TaskDefinition } from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { StrictPriorityPolicy } from './strict-priority-policy.js';

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

describe('StrictPriorityPolicy', () => {
  it('selects the task with the highest initial priority', () => {
    const policy = new StrictPriorityPolicy();
    const lowPriority = createTask('task-low', 0, 0, 1);
    const highPriority = createTask('task-high', 1, 2, 8);

    expect(
      policy.selectNextTask([lowPriority, highPriority], { currentTime: 5 })
        ?.id,
    ).toBe('task-high');
  });

  it('uses the complete FIFO order when priorities are equal', () => {
    const policy = new StrictPriorityPolicy();
    const laterTask = createTask('task-later', 2, 2, 4);
    const firstInsertedTask = createTask('task-first', 0, 1, 4);
    const secondInsertedTask = createTask('task-second', 1, 1, 4);

    expect(
      policy.selectNextTask(
        [laterTask, secondInsertedTask, firstInsertedTask],
        { currentTime: 5 },
      )?.id,
    ).toBe('task-first');
  });

  it('does not mutate the ready tasks', () => {
    const policy = new StrictPriorityPolicy();
    const tasks = [
      createTask('task-a', 0, 0, 1),
      createTask('task-b', 1, 0, 9),
    ];
    const originalTasks = structuredClone(tasks);

    policy.selectNextTask(tasks, { currentTime: 2 });

    expect(tasks).toEqual(originalTasks);
  });
});
