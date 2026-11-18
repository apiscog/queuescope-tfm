import type { PolicyId, TaskDefinition } from '@queuescope/contracts';

export interface SchedulingContext {
  readonly currentTime: number;
}

export interface SchedulingPolicy {
  readonly id: PolicyId;

  selectNextTask(
    readyTasks: readonly TaskDefinition[],
    context: SchedulingContext,
  ): TaskDefinition | undefined;
}
