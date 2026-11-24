// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type {
  ComparisonResult,
  PolicyConfiguration,
  RunResult,
  Scenario,
} from '@queuescope/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import {
  createComparison,
  createScenario,
  getComparison,
  getScenario,
  listScenarios,
  previewScenario,
} from './api';

vi.mock('./api', () => ({
  getScenario: vi.fn(),
  listScenarios: vi.fn(),
  previewScenario: vi.fn(),
  createScenario: vi.fn(),
  createComparison: vi.fn(),
  getComparison: vi.fn(),
}));

const scenario: Scenario = {
  id: 'scenario-test',
  name: 'Escenari de prova',
  timeUnit: 'tick',
  workers: { count: 2 },
  tasks: [
    {
      id: 'task-a',
      sequence: 0,
      type: 'informe',
      arrivalTime: 1,
      serviceDuration: 3,
      initialPriority: 4,
    },
  ],
  source: {
    kind: 'generated',
    parameters: {
      taskCount: 1,
      workerCount: 2,
      arrivalTimeRange: { minimum: 1, maximum: 1 },
      serviceDurationRange: { minimum: 3, maximum: 3 },
      priorityRange: { minimum: 4, maximum: 4 },
      taskTypes: ['informe'],
      seed: 12345,
    },
  },
  createdAt: '2026-11-23T10:00:00.000Z',
};

const waitingTime = { sampleSize: 1, mean: 0, median: 0, p95: 0, maximum: 0 };
const turnaroundTime = {
  sampleSize: 1,
  mean: 3,
  median: 3,
  p95: 3,
  maximum: 3,
};

function run(runId: string, policy: PolicyConfiguration): RunResult {
  return {
    runId,
    scenarioId: scenario.id,
    policy,
    engineVersion: '0.3.0',
    taskResults: [
      {
        taskId: 'task-a',
        workerId: 'worker-1',
        initialPriority: 4,
        arrivalTime: 1,
        serviceStartTime: 1,
        completionTime: 4,
        waitingTime: 0,
        turnaroundTime: 3,
      },
    ],
    metrics: {
      completedTaskCount: 1,
      simulationSpan: 3,
      throughput: 1 / 3,
      workerUtilization: 0.5,
      waitingTime,
      turnaroundTime,
      byInitialPriority: [
        {
          initialPriority: 4,
          completedTaskCount: 1,
          waitingTime,
          turnaroundTime,
        },
      ],
    },
  };
}

const comparison: ComparisonResult = {
  comparisonId: 'comparison-test',
  scenarioSnapshot: scenario,
  runs: [
    run('run-fifo', { id: 'fifo' }),
    run('run-priority', { id: 'strict-priority' }),
  ],
  createdAt: '2026-11-23T10:05:00.000Z',
};

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('interfície d’escenaris', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    vi.mocked(listScenarios).mockReset();
    vi.mocked(getScenario).mockReset();
    vi.mocked(previewScenario).mockReset();
    vi.mocked(createScenario).mockReset();
    vi.mocked(createComparison).mockReset();
    vi.mocked(getComparison).mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('llista un escenari i mostra les seves tasques en obrir-lo', async () => {
    vi.mocked(listScenarios).mockResolvedValue([scenario]);
    vi.mocked(getScenario).mockResolvedValue(scenario);
    renderApp();

    expect(await screen.findByText('Escenari de prova')).toBeTruthy();
    expect(screen.getByText('1 tasca · 2 workers')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('link', { name: 'Veure escenari: Escenari de prova' }),
    );

    expect(await screen.findByText('task-a')).toBeTruthy();
    expect(
      screen.getByText('Càrrega reproduïble amb la llavor 12345.'),
    ).toBeTruthy();
    expect(vi.mocked(getScenario)).toHaveBeenCalledWith('scenario-test');
  });

  it('permet tornar a carregar després d’un error', async () => {
    vi.mocked(listScenarios)
      .mockRejectedValueOnce(new Error('No es pot contactar amb l’API'))
      .mockResolvedValueOnce([scenario]);
    renderApp();

    expect(
      await screen.findByText('No es pot contactar amb l’API'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    expect(await screen.findByText('Escenari de prova')).toBeTruthy();
  });

  it('previsualitza abans de desar i obre el nou escenari', async () => {
    window.history.pushState({}, '', '/scenarios/new');
    vi.mocked(previewScenario).mockResolvedValue(scenario);
    vi.mocked(createScenario).mockResolvedValue(scenario);
    vi.mocked(getScenario).mockResolvedValue(scenario);
    renderApp();

    fireEvent.click(
      screen.getByRole('button', { name: 'Previsualitza les tasques' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Previsualització' }),
    ).toBeTruthy();
    expect(vi.mocked(previewScenario)).toHaveBeenCalledOnce();
    expect(vi.mocked(createScenario)).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Desa aquest escenari' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Escenari de prova' }),
    ).toBeTruthy();
    expect(vi.mocked(createScenario).mock.calls[0]?.[0]).toEqual(scenario);
  });

  it('rebutja un rang on el mínim supera el màxim', async () => {
    window.history.pushState({}, '', '/scenarios/new');
    renderApp();

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Arribada mínima (ticks)' }),
      {
        target: { value: '8' },
      },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Previsualitza les tasques' }),
    );

    expect(
      await screen.findByText('El màxim ha de ser igual o superior al mínim'),
    ).toBeTruthy();
    expect(vi.mocked(previewScenario)).not.toHaveBeenCalled();
  });

  it('executa dues polítiques i mostra la taula de mètriques desada', async () => {
    window.history.pushState({}, '', '/scenarios/scenario-test');
    vi.mocked(getScenario).mockResolvedValue(scenario);
    vi.mocked(createComparison).mockResolvedValue(comparison);
    vi.mocked(getComparison).mockResolvedValue(comparison);
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Escenari de prova' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Executa la comparació' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Resum de resultats' }),
    ).toBeTruthy();
    expect(vi.mocked(createComparison).mock.calls[0]?.[0]).toEqual({
      scenarioId: 'scenario-test',
      policies: [{ id: 'fifo' }, { id: 'strict-priority' }],
    });
    expect(vi.mocked(getComparison)).toHaveBeenCalledWith('comparison-test');
    expect(
      screen.getByRole('table', { name: 'Comparació de mètriques' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: "Temps d'espera per política" }),
    ).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Espera mitjana per prioritat inicial' }),
    ).toBeTruthy();
  });

  it('no permet executar només una política', async () => {
    window.history.pushState({}, '', '/scenarios/scenario-test');
    vi.mocked(getScenario).mockResolvedValue(scenario);
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Escenari de prova' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Prioritat estricta/ }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Executa la comparació' }),
    );

    expect(
      await screen.findByText(/Selecciona almenys dues polítiques/),
    ).toBeTruthy();
    expect(vi.mocked(createComparison)).not.toHaveBeenCalled();
  });

  it('envia el paràmetre d’envelliment quan es trien tres polítiques', async () => {
    window.history.pushState({}, '', '/scenarios/scenario-test');
    vi.mocked(getScenario).mockResolvedValue(scenario);
    vi.mocked(createComparison).mockResolvedValue({
      ...comparison,
      runs: [
        ...comparison.runs,
        run('run-aging', { id: 'priority-aging', agingInterval: 2 }),
      ],
    });
    vi.mocked(getComparison).mockResolvedValue(comparison);
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Escenari de prova' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Prioritat amb envelliment/ }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Executa la comparació' }),
    );

    await waitFor(() =>
      expect(vi.mocked(createComparison).mock.calls[0]?.[0]).toEqual({
        scenarioId: 'scenario-test',
        policies: [
          { id: 'fifo' },
          { id: 'strict-priority' },
          { id: 'priority-aging', agingInterval: 2 },
        ],
      }),
    );
  });
});
