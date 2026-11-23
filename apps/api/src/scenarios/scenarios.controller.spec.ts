import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { ScenariosController } from './scenarios.controller';
import { ScenariosService } from './scenarios.service';

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

const previewInput = {
  id: 'scenario-preview-001',
  name: 'Escenari sintètic de prova',
  createdAt: '2026-11-23T10:00:00.000Z',
  parameters: {
    taskCount: 5,
    workerCount: 2,
    arrivalTimeRange: { minimum: 0, maximum: 6 },
    serviceDurationRange: { minimum: 1, maximum: 4 },
    priorityRange: { minimum: 0, maximum: 5 },
    taskTypes: ['correu', 'informe'],
    seed: 12345,
  },
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

  it('declares dependencies for the tsx development runtime', () => {
    expect(Reflect.getMetadata('self:paramtypes', ScenariosController)).toEqual(
      [{ index: 0, param: ScenariosService }],
    );
    expect(Reflect.getMetadata('self:paramtypes', ScenariosService)).toEqual([
      { index: 0, param: PrismaService },
    ]);
  });

  it('documents the scenario identifier as an editable Swagger path parameter', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );

    expect(document.paths['/scenarios/{id}']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'id', in: 'path', required: true }),
      ]),
    );
  });

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

  it('previews the same generated tasks for the same seed without persisting', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const first = await request(server)
      .post('/scenarios/preview')
      .send(previewInput);
    const second = await request(server)
      .post('/scenarios/preview')
      .send(previewInput);

    expect(first.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(first.body.tasks).toHaveLength(5);
    expect(first.body.source).toEqual({
      kind: 'generated',
      parameters: previewInput.parameters,
    });
    expect(create).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects an excessive generated workload', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .post('/scenarios/preview')
      .send({
        ...previewInput,
        parameters: { ...previewInput.parameters, taskCount: 1001 },
      });

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
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
