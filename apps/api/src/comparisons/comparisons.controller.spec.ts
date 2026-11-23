import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ScenarioSchema, type Scenario } from '@queuescope/contracts';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

const scenario: Scenario = ScenarioSchema.parse(
  JSON.parse(
    readFileSync(
      resolve(process.cwd(), '../../docs/examples/comparison-scenario.json'),
      'utf8',
    ),
  ) as unknown,
);

const scenarioRecord = {
  id: scenario.id,
  name: scenario.name,
  timeUnit: scenario.timeUnit,
  workerCount: scenario.workers.count,
  source: scenario.source,
  createdAt: new Date(scenario.createdAt),
  tasks: scenario.tasks.map((task) => ({
    ...task,
    scenarioId: scenario.id,
    arrivalTime: BigInt(task.arrivalTime),
    serviceDuration: BigInt(task.serviceDuration),
  })),
};

interface ComparisonCreateRequest {
  data: {
    id: string;
    scenarioId: string;
    scenarioSnapshot: Scenario;
    createdAt: Date;
    runs: {
      create: Array<{
        id: string;
        sequence: number;
        policy: unknown;
        metrics: unknown;
        engineVersion: string;
        status: string;
        startedAt: Date;
        completedAt: Date;
        taskResults: {
          create: Array<{ taskId: string; sequence: number }>;
        };
      }>;
    };
  };
}

describe('Comparisons HTTP', () => {
  let app: INestApplication;
  let storedComparison: unknown;
  const createScenario = vi.fn();
  const findScenario = vi.fn();
  const createComparison = vi.fn();
  const findComparison = vi.fn();

  beforeEach(async () => {
    storedComparison = null;
    createScenario.mockReset().mockResolvedValue(scenarioRecord);
    findScenario.mockReset().mockResolvedValue(scenarioRecord);
    createComparison
      .mockReset()
      .mockImplementation(async (request: unknown) => {
        const { data } = request as ComparisonCreateRequest;
        storedComparison = {
          ...data,
          runs: data.runs.create.map((run) => ({
            ...run,
            taskResults: run.taskResults.create.map((task) => ({
              ...task,
              runId: run.id,
            })),
          })),
        };
        return storedComparison;
      });
    findComparison.mockReset().mockImplementation(async () => storedComparison);

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        scenario: {
          create: createScenario,
          findUnique: findScenario,
        },
        comparison: {
          create: createComparison,
          findUnique: findComparison,
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a scenario, compares the same snapshot and retrieves the results', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const createdScenario = await request(server)
      .post('/scenarios')
      .send(scenario);
    expect(createdScenario.status).toBe(201);

    const created = await request(server)
      .post('/comparisons')
      .send({
        scenarioId: scenario.id,
        policies: [{ id: 'fifo' }, { id: 'strict-priority' }],
      });
    expect(created.status).toBe(201);
    expect(created.body.scenarioSnapshot).toEqual(scenario);
    expect(created.body.runs).toHaveLength(2);
    expect(
      created.body.runs.map((run: { policy: { id: string } }) => run.policy.id),
    ).toEqual(['fifo', 'strict-priority']);
    expect(created.body.runs[0].metrics.waitingTime.maximum).toBe(6);
    expect(created.body.runs[1].metrics.waitingTime.maximum).toBe(4);

    const savedInput = createComparison.mock
      .calls[0]?.[0] as ComparisonCreateRequest;
    expect(savedInput.data.scenarioSnapshot).toEqual(scenario);
    expect(savedInput.data.runs.create).toHaveLength(2);
    expect(
      savedInput.data.runs.create.every((run) => run.status === 'completed'),
    ).toBe(true);

    const retrieved = await request(server).get(
      `/comparisons/${String(created.body.comparisonId)}`,
    );
    expect(retrieved.status).toBe(200);
    expect(retrieved.body).toEqual(created.body);
  });

  it('rejects duplicate policies before loading the scenario', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .post('/comparisons')
      .send({
        scenarioId: scenario.id,
        policies: [{ id: 'fifo' }, { id: 'fifo' }],
      });

    expect(response.status).toBe(400);
    expect(findScenario).not.toHaveBeenCalled();
    expect(createComparison).not.toHaveBeenCalled();
  });

  it('persists the aging interval alongside all three policy results', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .post('/comparisons')
      .send({
        scenarioId: scenario.id,
        policies: [
          { id: 'fifo' },
          { id: 'strict-priority' },
          { id: 'priority-aging', agingInterval: 2 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.runs).toHaveLength(3);
    expect(response.body.runs[2].policy).toEqual({
      id: 'priority-aging',
      agingInterval: 2,
    });
    const savedInput = createComparison.mock
      .calls[0]?.[0] as ComparisonCreateRequest;
    expect(savedInput.data.runs.create[2]?.policy).toEqual({
      id: 'priority-aging',
      agingInterval: 2,
    });
  });

  it('returns 404 for missing scenarios and comparisons', async () => {
    findScenario.mockResolvedValue(null);
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const create = await request(server)
      .post('/comparisons')
      .send({
        scenarioId: scenario.id,
        policies: [{ id: 'fifo' }, { id: 'strict-priority' }],
      });
    expect(create.status).toBe(404);
    expect((await request(server).get('/comparisons/absent')).status).toBe(404);
  });

  it('documents the comparison identifier in Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    expect(document.paths['/comparisons/{id}']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', in: 'path', required: true }),
      ]),
    );
  });
});
