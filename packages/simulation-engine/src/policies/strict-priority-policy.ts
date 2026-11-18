import type { TaskDefinition } from '@queuescope/contracts';

import { compareTasksByFifo } from './fifo-policy.js';
import type {
  SchedulingContext,
  SchedulingPolicy,
} from './scheduling-policy.js';

export function compareTasksByStrictPriority(
  left: TaskDefinition,
  right: TaskDefinition,
): number {
  return (
    right.initialPriority - left.initialPriority ||
    compareTasksByFifo(left, right)
  );
}

export class StrictPriorityPolicy implements SchedulingPolicy {
  readonly configuration = { id: 'strict-priority' } as const;

  selectNextTask(
    readyTasks: readonly TaskDefinition[],
    context: SchedulingContext,
  ): TaskDefinition | undefined {
    void context;
    let selectedTask: TaskDefinition | undefined;

    for (const task of readyTasks) {
      if (
        selectedTask === undefined ||
        compareTasksByStrictPriority(task, selectedTask) < 0
      ) {
        selectedTask = task;
      }
    }

    return selectedTask;
  }
}
