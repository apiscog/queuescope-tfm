import type { TaskDefinition } from '@queuescope/contracts';

import { compareIdentifiers } from '../domain/compare-identifiers.js';

interface BaseSimulationEvent {
  readonly time: number;
  readonly task: TaskDefinition;
}

export interface TaskArrivalEvent extends BaseSimulationEvent {
  readonly kind: 'task-arrival';
}

export interface TaskCompletionEvent extends BaseSimulationEvent {
  readonly kind: 'task-completion';
  readonly workerId: string;
  readonly workerIndex: number;
  readonly serviceStartTime: number;
}

export type SimulationEvent = TaskArrivalEvent | TaskCompletionEvent;

function eventKindOrder(event: SimulationEvent): number {
  return event.kind === 'task-completion' ? 0 : 1;
}

export function compareSimulationEvents(
  left: SimulationEvent,
  right: SimulationEvent,
): number {
  return (
    left.time - right.time ||
    eventKindOrder(left) - eventKindOrder(right) ||
    left.task.sequence - right.task.sequence ||
    compareIdentifiers(left.task.id, right.task.id) ||
    (left.kind === 'task-completion' ? left.workerIndex : -1) -
      (right.kind === 'task-completion' ? right.workerIndex : -1)
  );
}
