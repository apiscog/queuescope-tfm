import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { ComparisonResult } from '@queuescope/contracts';

import { ComparisonsService } from './comparisons.service';

@ApiTags('comparacions')
@Controller('comparisons')
export class ComparisonsController {
  constructor(
    @Inject(ComparisonsService)
    private readonly comparisons: ComparisonsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Executa i desa diverses polítiques sobre el mateix escenari',
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        scenarioId: 'scenario-comparison-001',
        policies: [{ id: 'fifo' }, { id: 'strict-priority' }],
      },
    },
  })
  @ApiCreatedResponse({ description: 'Comparació completada i desada' })
  @ApiBadRequestResponse({ description: 'Polítiques o escenari invàlids' })
  @ApiNotFoundResponse({ description: 'No existeix l’escenari' })
  create(@Body() input: unknown): Promise<ComparisonResult> {
    return this.comparisons.create(input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta una comparació i els seus resultats' })
  @ApiParam({
    name: 'id',
    description: 'Identificador de la comparació',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ description: 'Comparació, mètriques i tasques' })
  @ApiBadRequestResponse({ description: 'Identificador invàlid' })
  @ApiNotFoundResponse({ description: 'No existeix la comparació' })
  findOne(@Param('id') id: string): Promise<ComparisonResult> {
    return this.comparisons.findOne(id);
  }
}
