import {
  RunInputSchema,
  TaskResultSchema,
  type RunInput,
  type TaskDefinition,
  type TaskResult,
} from '@queuescope/contracts';

import type { EngineRunResult } from '../domain/engine-run-result.js';
import { compareIdentifiers } from '../domain/compare-identifiers.js';
import type { WorkerState } from '../domain/worker-state.js';
import { FutureEventQueue } from '../events/future-event-queue.js';
import type {
  SimulationEvent,
  TaskArrivalEvent,
  TaskCompletionEvent,
} from '../events/simulation-event.js';
import {
  policyConfigurationsEqual,
  type SchedulingPolicy,
} from '../policies/scheduling-policy.js';

type TaskLifecycleState = 'scheduled' | 'ready' | 'active' | 'completed';

interface CompletedTask {
  readonly sequence: number;
  readonly taskId: string;
  readonly result: TaskResult;
}

function assertInvariant(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(`Simulation invariant violated: ${message}`);
  }
}

function calculateCompletionTime(
  currentTime: number,
  serviceDuration: number,
): number {
  const completionTime = currentTime + serviceDuration;
  if (!Number.isSafeInteger(completionTime)) {
    throw new RangeError('Task completion time exceeds the safe integer range');
  }
  return completionTime;
}

export class SimulationEngine {
  run(input: RunInput, policy: SchedulingPolicy): EngineRunResult {
    const validatedInput = RunInputSchema.parse(input);
    if (
      !policyConfigurationsEqual(validatedInput.policy, policy.configuration)
    ) {
      throw new Error(
        `Input policy ${JSON.stringify(validatedInput.policy)} does not match implementation ${JSON.stringify(policy.configuration)}`,
      );
    }

    const workers: WorkerState[] = Array.from(
      { length: validatedInput.scenario.workers.count },
      (_, index) => ({
        id: `worker-${index + 1}`,
        index,
        activeTaskId: null,
      }),
    );
    const eventQueue = new FutureEventQueue();
    const readyTasks: TaskDefinition[] = [];
    const completedTasks: CompletedTask[] = [];
    const taskStates = new Map<string, TaskLifecycleState>();

    for (const task of validatedInput.scenario.tasks) {
      taskStates.set(task.id, 'scheduled');
      eventQueue.enqueue({
        kind: 'task-arrival',
        time: task.arrivalTime,
        task,
      });
    }

    while (!eventQueue.isEmpty) {
      const events = eventQueue.dequeueNextBatch();
      const firstEvent = events[0];
      assertInvariant(firstEvent !== undefined, 'event batch cannot be empty');
      const currentTime = firstEvent.time;

      this.processCompletions(
        events,
        currentTime,
        workers,
        taskStates,
        completedTasks,
      );
      this.processArrivals(events, readyTasks, taskStates);
      this.assignReadyTasks(
        currentTime,
        workers,
        readyTasks,
        taskStates,
        eventQueue,
        policy,
      );
    }

    assertInvariant(readyTasks.length === 0, 'ready queue must be empty');
    assertInvariant(
      workers.every((worker) => worker.activeTaskId === null),
      'all workers must be idle after the final event',
    );
    assertInvariant(
      [...taskStates.values()].every((state) => state === 'completed'),
      'every task must be completed after the final event',
    );

    const taskResults = completedTasks
      .toSorted(
        (left, right) =>
          left.sequence - right.sequence ||
          compareIdentifiers(left.taskId, right.taskId),
      )
      .map(({ result }) => result);

    return {
      runId: validatedInput.runId,
      scenarioId: validatedInput.scenario.id,
      policy: validatedInput.policy,
      engineVersion: validatedInput.engineVersion,
      taskResults,
    };
  }

  private processCompletions(
    events: readonly SimulationEvent[],
    currentTime: number,
    workers: WorkerState[],
    taskStates: Map<string, TaskLifecycleState>,
    completedTasks: CompletedTask[],
  ): void {
    for (const event of events) {
      if (event.kind !== 'task-completion') {
        continue;
      }

      assertInvariant(
        event.time === currentTime,
        'completion event time must equal the current time',
      );
      const worker = workers[event.workerIndex];
      assertInvariant(worker !== undefined, 'completion worker must exist');
      assertInvariant(
        worker.id === event.workerId,
        'completion worker identity must be stable',
      );
      assertInvariant(
        worker.activeTaskId === event.task.id,
        'worker must be running the completing task',
      );
      assertInvariant(
        taskStates.get(event.task.id) === 'active',
        'completing task must be active',
      );

      worker.activeTaskId = null;
      taskStates.set(event.task.id, 'completed');
      completedTasks.push({
        sequence: event.task.sequence,
        taskId: event.task.id,
        result: TaskResultSchema.parse({
          taskId: event.task.id,
          workerId: event.workerId,
          initialPriority: event.task.initialPriority,
          arrivalTime: event.task.arrivalTime,
          serviceStartTime: event.serviceStartTime,
          completionTime: currentTime,
          waitingTime: event.serviceStartTime - event.task.arrivalTime,
          turnaroundTime: currentTime - event.task.arrivalTime,
        }),
      });
    }
  }

  private processArrivals(
    events: readonly SimulationEvent[],
    readyTasks: TaskDefinition[],
    taskStates: Map<string, TaskLifecycleState>,
  ): void {
    for (const event of events) {
      if (event.kind !== 'task-arrival') {
        continue;
      }

      assertInvariant(
        taskStates.get(event.task.id) === 'scheduled',
        'arriving task must be scheduled',
      );
      taskStates.set(event.task.id, 'ready');
      readyTasks.push(event.task);
    }
  }

  private assignReadyTasks(
    currentTime: number,
    workers: WorkerState[],
    readyTasks: TaskDefinition[],
    taskStates: Map<string, TaskLifecycleState>,
    eventQueue: FutureEventQueue,
    policy: SchedulingPolicy,
  ): void {
    for (const worker of workers) {
      if (worker.activeTaskId !== null) {
        continue;
      }

      const selectedTask = policy.selectNextTask(readyTasks, { currentTime });
      if (selectedTask === undefined) {
        break;
      }

      assertInvariant(
        taskStates.get(selectedTask.id) === 'ready',
        'selected task must be ready',
      );
      assertInvariant(
        selectedTask.arrivalTime <= currentTime,
        'selected task cannot start before arrival',
      );

      const readyTaskIndex = readyTasks.findIndex(
        (task) => task.id === selectedTask.id,
      );
      assertInvariant(
        readyTaskIndex >= 0,
        'selected task must belong to the ready queue',
      );
      readyTasks.splice(readyTaskIndex, 1);

      worker.activeTaskId = selectedTask.id;
      taskStates.set(selectedTask.id, 'active');
      const completionEvent: TaskCompletionEvent = {
        kind: 'task-completion',
        time: calculateCompletionTime(
          currentTime,
          selectedTask.serviceDuration,
        ),
        task: selectedTask,
        workerId: worker.id,
        workerIndex: worker.index,
        serviceStartTime: currentTime,
      };
      eventQueue.enqueue(completionEvent);
    }
  }
}

export type { TaskArrivalEvent, TaskCompletionEvent };
