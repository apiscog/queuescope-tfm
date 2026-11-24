// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import type { RunResult, TaskResult } from '@queuescope/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TaskTimeline } from './TaskTimeline';

const fifoTasks: TaskResult[] = [
  {
    taskId: 'task-a',
    workerId: 'worker-1',
    initialPriority: 1,
    arrivalTime: 0,
    serviceStartTime: 0,
    completionTime: 3,
    waitingTime: 0,
    turnaroundTime: 3,
  },
  {
    taskId: 'task-b',
    workerId: 'worker-1',
    initialPriority: 5,
    arrivalTime: 0,
    serviceStartTime: 3,
    completionTime: 5,
    waitingTime: 3,
    turnaroundTime: 5,
  },
];

const priorityTasks: TaskResult[] = [
  {
    taskId: 'task-a',
    workerId: 'worker-1',
    initialPriority: 1,
    arrivalTime: 0,
    serviceStartTime: 2,
    completionTime: 5,
    waitingTime: 2,
    turnaroundTime: 5,
  },
  {
    taskId: 'task-b',
    workerId: 'worker-1',
    initialPriority: 5,
    arrivalTime: 0,
    serviceStartTime: 0,
    completionTime: 2,
    waitingTime: 0,
    turnaroundTime: 2,
  },
];

function makeRun(
  runId: string,
  policy: RunResult['policy'],
  taskResults: TaskResult[],
): RunResult {
  const waits = taskResults
    .map((task) => task.waitingTime)
    .sort((a, b) => a - b);
  const turnarounds = taskResults
    .map((task) => task.turnaroundTime)
    .sort((a, b) => a - b);
  const summary = (values: number[]) => ({
    sampleSize: values.length,
    mean: (values[0]! + values[1]!) / 2,
    median: (values[0]! + values[1]!) / 2,
    p95: values[1]!,
    maximum: values[1]!,
  });
  return {
    runId,
    scenarioId: 'scenario-timeline',
    policy,
    engineVersion: '0.3.0',
    taskResults,
    metrics: {
      completedTaskCount: 2,
      simulationSpan: 5,
      throughput: 2 / 5,
      workerUtilization: 1,
      waitingTime: summary(waits),
      turnaroundTime: summary(turnarounds),
      byInitialPriority: taskResults.map((task) => ({
        initialPriority: task.initialPriority,
        completedTaskCount: 1,
        waitingTime: {
          sampleSize: 1,
          mean: task.waitingTime,
          median: task.waitingTime,
          p95: task.waitingTime,
          maximum: task.waitingTime,
        },
        turnaroundTime: {
          sampleSize: 1,
          mean: task.turnaroundTime,
          median: task.turnaroundTime,
          p95: task.turnaroundTime,
          maximum: task.turnaroundTime,
        },
      })),
    },
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('línia temporal de tasques', () => {
  it('avança pels esdeveniments desats i actualitza la cua i el worker', () => {
    render(
      <TaskTimeline
        runs={[makeRun('fifo-run', { id: 'fifo' }, fifoTasks)]}
        workerCount={1}
      />,
    );

    expect(screen.getByText('TICK 0 · ESDEVENIMENT 1 DE 3')).toBeTruthy();
    expect(
      within(screen.getByRole('region', { name: 'Tasques en cua' })).getByText(
        'task-b',
      ),
    ).toBeTruthy();
    expect(
      within(
        screen.getByRole('region', { name: 'Estat dels workers' }),
      ).getByText('task-a'),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Esdeveniment següent' }),
    );
    expect(screen.getByText('TICK 3 · ESDEVENIMENT 2 DE 3')).toBeTruthy();
    expect(
      within(
        screen.getByRole('region', { name: 'Estat dels workers' }),
      ).getByText('task-b'),
    ).toBeTruthy();
    expect(
      within(
        screen.getByRole('region', { name: 'Tasques completades' }),
      ).getByText('task-a'),
    ).toBeTruthy();
  });

  it('pot pausar la reproducció automàtica sense alterar el tick actual', () => {
    vi.useFakeTimers();
    render(
      <TaskTimeline
        runs={[makeRun('fifo-run', { id: 'fifo' }, fifoTasks)]}
        workerCount={1}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Inicia' }));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByText('TICK 3 · ESDEVENIMENT 2 DE 3')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Pausa' }));
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.getByText('TICK 3 · ESDEVENIMENT 2 DE 3')).toBeTruthy();
  });

  it('manté els passos manuals quan es demana moviment reduït', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(
      <TaskTimeline
        runs={[makeRun('fifo-run', { id: 'fifo' }, fifoTasks)]}
        workerCount={1}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Inicia' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Esdeveniment següent' }),
    );
    expect(screen.getByText('TICK 3 · ESDEVENIMENT 2 DE 3')).toBeTruthy();
  });

  it('mostra els temps desats de la política seleccionada, sense recalcular-los', () => {
    render(
      <TaskTimeline
        runs={[
          makeRun('fifo-run', { id: 'fifo' }, fifoTasks),
          makeRun('priority-run', { id: 'strict-priority' }, priorityTasks),
        ]}
        workerCount={1}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: /task-b: arriba al tick 0, espera 3 ticks i es processa del tick 3 al 5/,
      }),
    ).toBeTruthy();
    fireEvent.keyDown(
      screen.getByRole('combobox', { name: 'Política de la línia temporal' }),
      { key: 'ArrowDown' },
    );
    fireEvent.click(screen.getByRole('option', { name: 'Prioritat estricta' }));
    expect(
      screen.getByRole('img', {
        name: /task-b: arriba al tick 0, espera 0 ticks i es processa del tick 0 al 2/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', {
        name: /task-a: arriba al tick 0, espera 2 ticks i es processa del tick 2 al 5/,
      }),
    ).toBeTruthy();
  });
});
