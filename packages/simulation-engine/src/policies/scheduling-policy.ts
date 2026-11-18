import type {
  PolicyConfiguration,
  TaskDefinition,
} from '@queuescope/contracts';

export interface SchedulingContext {
  readonly currentTime: number;
}

export interface SchedulingPolicy {
  readonly configuration: PolicyConfiguration;

  selectNextTask(
    readyTasks: readonly TaskDefinition[],
    context: SchedulingContext,
  ): TaskDefinition | undefined;
}

export function policyConfigurationsEqual(
  left: PolicyConfiguration,
  right: PolicyConfiguration,
): boolean {
  if (left.id !== right.id) {
    return false;
  }

  if (left.id === 'priority-aging' && right.id === 'priority-aging') {
    return left.agingInterval === right.agingInterval;
  }

  return true;
}
