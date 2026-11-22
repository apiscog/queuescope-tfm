import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

const scenario = {
  id: 'manual-test',
  name: 'Escenari de prova',
  timeUnit: 'tick',
  workers: { count: 1 },
  source: { kind: 'manual' },
  createdAt: '2026-11-22T10:00:00.000Z',
  tasks: [
    {
      id: 'task-a',
      sequence: 0,
      type: 'correu',
      arrivalTime: 0,
      serviceDuration: 3,
      initialPriority: 1,
    },
  ],
};

const savedRecord = {
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

describe('Scenarios HTTP', () => {
  let app: INestApplication;
  const create = vi.fn();
  const findMany = vi.fn();
  const findUnique = vi.fn();

  beforeEach(async () => {
    create.mockReset().mockResolvedValue(savedRecord);
    findMany.mockReset().mockResolvedValue([savedRecord]);
    findUnique.mockReset().mockResolvedValue(savedRecord);

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ scenario: { create, findMany, findUnique } })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates and retrieves a scenario through HTTP', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const created = await request(server).post('/scenarios').send(scenario);
    expect(created.status).toBe(201);
    expect(created.body).toEqual(scenario);
    expect(create).toHaveBeenCalledOnce();

    const list = await request(server).get('/scenarios');
    expect(list.status).toBe(200);
    expect(list.body).toEqual([scenario]);

    const detail = await request(server).get('/scenarios/manual-test');
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual(scenario);
  });

  it('rejects invalid tasks before writing to the database', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .post('/scenarios')
      .send({
        ...scenario,
        tasks: [{ ...scenario.tasks[0], arrivalTime: -1 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('L’escenari no és vàlid');
    expect(create).not.toHaveBeenCalled();
  });

  it('reports duplicate identifiers and missing scenarios clearly', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '6.19.2',
      }),
    );
    findUnique.mockResolvedValue(null);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    expect(
      (await request(server).post('/scenarios').send(scenario)).status,
    ).toBe(409);
    expect((await request(server).get('/scenarios/absent')).status).toBe(404);
  });
});
