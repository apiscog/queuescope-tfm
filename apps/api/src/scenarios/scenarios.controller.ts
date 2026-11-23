import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Scenario } from '@queuescope/contracts';

import { ScenariosService } from './scenarios.service';

const scenarioExample = {
  id: 'escenari-demo-1',
  name: 'Dues tasques de prova',
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
    {
      id: 'task-b',
      sequence: 1,
      type: 'informe',
      arrivalTime: 1,
      serviceDuration: 2,
      initialPriority: 5,
    },
  ],
};

@ApiTags('escenaris')
@Controller('scenarios')
export class ScenariosController {
  constructor(
    @Inject(ScenariosService) private readonly scenarios: ScenariosService,
  ) {}

  @Post('preview')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Previsualitza una càrrega generada sense desar-la',
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
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
      },
    },
  })
  @ApiOkResponse({ description: 'Escenari generat, encara no desat' })
  @ApiBadRequestResponse({ description: 'Paràmetres de generació invàlids' })
  preview(@Body() input: unknown): Scenario {
    return this.scenarios.preview(input);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un escenari manual i desa les tasques' })
  @ApiBody({ schema: { type: 'object', example: scenarioExample } })
  @ApiCreatedResponse({
    description: 'Escenari desat',
    schema: { example: scenarioExample },
  })
  @ApiBadRequestResponse({ description: 'Dades de l’escenari invàlides' })
  @ApiConflictResponse({ description: 'Identificador ja existent' })
  create(@Body() input: unknown): Promise<Scenario> {
    return this.scenarios.create(input);
  }

  @Get()
  @ApiOperation({ summary: 'Llista els escenaris desats' })
  @ApiOkResponse({
    description: 'Escenaris desats',
    schema: {
      type: 'array',
      items: { type: 'object', example: scenarioExample },
    },
  })
  findAll(): Promise<Scenario[]> {
    return this.scenarios.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta un escenari i les seves tasques' })
  @ApiParam({
    name: 'id',
    description: 'Identificador de l’escenari',
    example: 'escenari-demo-1',
  })
  @ApiOkResponse({
    description: 'Escenari desat',
    schema: { example: scenarioExample },
  })
  @ApiNotFoundResponse({ description: 'No existeix l’escenari' })
  findOne(@Param('id') id: string): Promise<Scenario> {
    return this.scenarios.findOne(id);
  }
}
