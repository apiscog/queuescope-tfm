import type { TaskDefinition } from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { FifoPolicy } from './fifo-policy.js';

function createTask(
  id: string,
  sequence: number,
  arrivalTime: number,
): TaskDefinition {
  return {
    id,
    sequence,
    type: 'test',
    arrivalTime,
    serviceDuration: 1,
    initialPriority: 0,
  };
}

describe('FifoPolicy', () => {
  it('selects by arrival, insertion sequence and identifier', () => {
    const policy = new FifoPolicy();
    const tasks = [
      createTask('task-z', 3, 2),
      createTask('task-b', 2, 1),
      createTask('task-a', 1, 1),
    ];
    const originalOrder = tasks.map((task) => task.id);

    expect(policy.selectNextTask(tasks, { currentTime: 2 })?.id).toBe('task-a');
    expect(tasks.map((task) => task.id)).toEqual(originalOrder);
  });

  it('returns undefined when there are no ready tasks', () => {
    expect(
      new FifoPolicy().selectNextTask([], { currentTime: 0 }),
    ).toBeUndefined();
  });
});
