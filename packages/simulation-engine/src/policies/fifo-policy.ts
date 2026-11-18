import type { TaskDefinition } from '@queuescope/contracts';

import { compareIdentifiers } from '../domain/compare-identifiers.js';
import type {
  SchedulingContext,
  SchedulingPolicy,
} from './scheduling-policy.js';

export function compareTasksByFifo(
  left: TaskDefinition,
  right: TaskDefinition,
): number {
  return (
    left.arrivalTime - right.arrivalTime ||
    left.sequence - right.sequence ||
    compareIdentifiers(left.id, right.id)
  );
}

export class FifoPolicy implements SchedulingPolicy {
  readonly id = 'fifo' as const;

  selectNextTask(
    readyTasks: readonly TaskDefinition[],
    context: SchedulingContext,
  ): TaskDefinition | undefined {
    void context;
    let selectedTask: TaskDefinition | undefined;

    for (const task of readyTasks) {
      if (
        selectedTask === undefined ||
        compareTasksByFifo(task, selectedTask) < 0
      ) {
        selectedTask = task;
      }
    }

    return selectedTask;
  }
}
