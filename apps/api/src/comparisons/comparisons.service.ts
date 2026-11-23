import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ComparisonResultSchema,
  CreateComparisonInputSchema,
  type ComparisonResult,
  type Scenario,
} from '@queuescope/contracts';
import {
  runSimulation,
  SIMULATION_ENGINE_VERSION,
} from '@queuescope/simulation-engine';

import { PrismaService } from '../database/prisma.service';
import { ScenariosService } from '../scenarios/scenarios.service';

type ComparisonWithRuns = Prisma.ComparisonGetPayload<{
  include: { runs: { include: { taskResults: true } } };
}>;

function toComparison(record: ComparisonWithRuns): ComparisonResult {
  return ComparisonResultSchema.parse({
    comparisonId: record.id,
    scenarioSnapshot: record.scenarioSnapshot,
    createdAt: record.createdAt.toISOString(),
    runs: record.runs
      .toSorted((left, right) => left.sequence - right.sequence)
      .map((run) => ({
        runId: run.id,
        scenarioId: record.scenarioId,
        policy: run.policy,
        engineVersion: run.engineVersion,
        metrics: run.metrics,
        taskResults: run.taskResults
          .toSorted((left, right) => left.sequence - right.sequence)
          .map((task) => ({
            taskId: task.taskId,
            workerId: task.workerId,
            initialPriority: task.initialPriority,
            arrivalTime: Number(task.arrivalTime),
            serviceStartTime: Number(task.serviceStartTime),
            completionTime: Number(task.completionTime),
            waitingTime: Number(task.waitingTime),
            turnaroundTime: Number(task.turnaroundTime),
          })),
      })),
  });
}

@Injectable()
export class ComparisonsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ScenariosService) private readonly scenarios: ScenariosService,
  ) {}

  async create(input: unknown): Promise<ComparisonResult> {
    const parsed = CreateComparisonInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'La comparació no és vàlida',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const scenario: Scenario = structuredClone(
      await this.scenarios.findOne(parsed.data.scenarioId),
    );
    const createdAt = new Date();
    const comparisonId = randomUUID();
    const runs = parsed.data.policies.map((policy) => {
      const startedAt = new Date();
      const result = runSimulation({
        runId: randomUUID(),
        scenario,
        policy,
        engineVersion: SIMULATION_ENGINE_VERSION,
      });
      return { result, startedAt, completedAt: new Date() };
    });

    const record = await this.prisma.comparison.create({
      data: {
        id: comparisonId,
        scenarioId: scenario.id,
        scenarioSnapshot: scenario as Prisma.InputJsonValue,
        createdAt,
        runs: {
          create: runs.map(({ result, startedAt, completedAt }, sequence) => ({
            id: result.runId,
            sequence,
            policy: result.policy as Prisma.InputJsonValue,
            engineVersion: result.engineVersion,
            status: 'completed',
            startedAt,
            completedAt,
            metrics: result.metrics as Prisma.InputJsonValue,
            taskResults: {
              create: result.taskResults.map((task, taskSequence) => ({
                taskId: task.taskId,
                sequence: taskSequence,
                workerId: task.workerId,
                initialPriority: task.initialPriority,
                arrivalTime: BigInt(task.arrivalTime),
                serviceStartTime: BigInt(task.serviceStartTime),
                completionTime: BigInt(task.completionTime),
                waitingTime: BigInt(task.waitingTime),
                turnaroundTime: BigInt(task.turnaroundTime),
              })),
            },
          })),
        },
      },
      include: { runs: { include: { taskResults: true } } },
    });

    return toComparison(record);
  }

  async findOne(id: string): Promise<ComparisonResult> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(id) || id.length > 100) {
      throw new BadRequestException(
        'L’identificador de la comparació no és vàlid',
      );
    }
    const record = await this.prisma.comparison.findUnique({
      where: { id },
      include: { runs: { include: { taskResults: true } } },
    });
    if (record === null) {
      throw new NotFoundException('No s’ha trobat la comparació');
    }
    return toComparison(record);
  }
}
