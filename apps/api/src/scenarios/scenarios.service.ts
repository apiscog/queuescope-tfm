import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GenerateScenarioInputSchema,
  ScenarioSchema,
  type Scenario,
} from '@queuescope/contracts';
import { generateScenario } from '@queuescope/simulation-engine';
import { ZodError } from 'zod';

import { PrismaService } from '../database/prisma.service';

type ScenarioWithTasks = Prisma.ScenarioGetPayload<{
  include: { tasks: true };
}>;

function toScenario(record: ScenarioWithTasks): Scenario {
  return ScenarioSchema.parse({
    id: record.id,
    name: record.name,
    timeUnit: record.timeUnit,
    workers: { count: record.workerCount },
    source: record.source,
    createdAt: record.createdAt.toISOString(),
    tasks: record.tasks
      .toSorted((left, right) => left.sequence - right.sequence)
      .map((task) => ({
        id: task.id,
        sequence: task.sequence,
        type: task.type,
        arrivalTime: Number(task.arrivalTime),
        serviceDuration: Number(task.serviceDuration),
        initialPriority: task.initialPriority,
      })),
  });
}

@Injectable()
export class ScenariosService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  preview(input: unknown): Scenario {
    const parsed = GenerateScenarioInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Els paràmetres de generació no són vàlids',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return generateScenario(parsed.data);
  }

  async create(input: unknown): Promise<Scenario> {
    let scenario: Scenario;
    try {
      scenario = ScenarioSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'L’escenari no és vàlid',
          issues: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      throw error;
    }

    try {
      const record = await this.prisma.scenario.create({
        data: {
          id: scenario.id,
          name: scenario.name,
          timeUnit: scenario.timeUnit,
          workerCount: scenario.workers.count,
          source: scenario.source as Prisma.InputJsonValue,
          createdAt: new Date(scenario.createdAt),
          tasks: {
            create: scenario.tasks.map((task) => ({
              id: task.id,
              sequence: task.sequence,
              type: task.type,
              arrivalTime: BigInt(task.arrivalTime),
              serviceDuration: BigInt(task.serviceDuration),
              initialPriority: task.initialPriority,
            })),
          },
        },
        include: { tasks: true },
      });
      return toScenario(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ja existeix un escenari amb aquest identificador',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Scenario[]> {
    const records = await this.prisma.scenario.findMany({
      include: { tasks: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return records.map(toScenario);
  }

  async findOne(id: string): Promise<Scenario> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(id) || id.length > 100) {
      throw new BadRequestException(
        'L’identificador de l’escenari no és vàlid',
      );
    }
    const record = await this.prisma.scenario.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (record === null) {
      throw new NotFoundException('No s’ha trobat l’escenari');
    }
    return toScenario(record);
  }
}
