import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: "Comprova l'estat de l'API" })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
