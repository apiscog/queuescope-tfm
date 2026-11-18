import {
  MAX_PRIORITY,
  PolicyConfigurationSchema,
  type PolicyConfiguration,
  type TaskDefinition,
} from '@queuescope/contracts';

import { compareTasksByFifo } from './fifo-policy.js';
import type {
  SchedulingContext,
  SchedulingPolicy,
} from './scheduling-policy.js';

type AgingPolicyConfiguration = Extract<
  PolicyConfiguration,
  { id: 'priority-aging' }
>;

export function calculateEffectivePriority(
  task: TaskDefinition,
  currentTime: number,
  agingInterval: number,
): number {
  if (!Number.isSafeInteger(currentTime) || currentTime < task.arrivalTime) {
    throw new RangeError(
      'Current time must be a safe integer at or after task arrival',
    );
  }
  if (!Number.isSafeInteger(agingInterval) || agingInterval <= 0) {
    throw new RangeError('Aging interval must be a positive safe integer');
  }

  const waitingTime = currentTime - task.arrivalTime;
  return Math.min(
    MAX_PRIORITY,
    task.initialPriority + Math.floor(waitingTime / agingInterval),
  );
}

export class AgingPolicy implements SchedulingPolicy {
  readonly configuration: AgingPolicyConfiguration;

  constructor(agingInterval: number) {
    this.configuration = PolicyConfigurationSchema.parse({
      id: 'priority-aging',
      agingInterval,
    }) as AgingPolicyConfiguration;
  }

  selectNextTask(
    readyTasks: readonly TaskDefinition[],
    context: SchedulingContext,
  ): TaskDefinition | undefined {
    let selectedTask: TaskDefinition | undefined;

    for (const task of readyTasks) {
      if (
        selectedTask === undefined ||
        this.compareTasks(task, selectedTask, context.currentTime) < 0
      ) {
        selectedTask = task;
      }
    }

    return selectedTask;
  }

  private compareTasks(
    left: TaskDefinition,
    right: TaskDefinition,
    currentTime: number,
  ): number {
    const leftPriority = calculateEffectivePriority(
      left,
      currentTime,
      this.configuration.agingInterval,
    );
    const rightPriority = calculateEffectivePriority(
      right,
      currentTime,
      this.configuration.agingInterval,
    );

    return rightPriority - leftPriority || compareTasksByFifo(left, right);
  }
}
