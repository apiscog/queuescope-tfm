import type { TaskDefinition } from '@queuescope/contracts';
import { describe, expect, it } from 'vitest';

import { FutureEventQueue } from './future-event-queue.js';

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

describe('FutureEventQueue', () => {
  it('returns the earliest time as one deterministic batch', () => {
    const queue = new FutureEventQueue();
    const taskA = createTask('task-a', 0, 1);
    const taskB = createTask('task-b', 1, 1);
    const taskC = createTask('task-c', 2, 5);

    queue.enqueue({ kind: 'task-arrival', time: 5, task: taskC });
    queue.enqueue({ kind: 'task-arrival', time: 1, task: taskB });
    queue.enqueue({ kind: 'task-arrival', time: 1, task: taskA });

    expect(queue.size).toBe(3);
    expect(queue.dequeueNextBatch()).toEqual([
      { kind: 'task-arrival', time: 1, task: taskA },
      { kind: 'task-arrival', time: 1, task: taskB },
    ]);
    expect(queue.dequeueNextBatch()).toEqual([
      { kind: 'task-arrival', time: 5, task: taskC },
    ]);
    expect(queue.isEmpty).toBe(true);
  });

  it('orders completions before arrivals at the same virtual time', () => {
    const queue = new FutureEventQueue();
    const arrivingTask = createTask('task-b', 1, 2);
    const completingTask = createTask('task-a', 0, 0);

    queue.enqueue({
      kind: 'task-arrival',
      time: 2,
      task: arrivingTask,
    });
    queue.enqueue({
      kind: 'task-completion',
      time: 2,
      task: completingTask,
      workerId: 'worker-1',
      workerIndex: 0,
      serviceStartTime: 0,
    });

    expect(queue.dequeueNextBatch().map((event) => event.kind)).toEqual([
      'task-completion',
      'task-arrival',
    ]);
  });
});
