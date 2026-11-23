import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ComparisonsController } from './comparisons/comparisons.controller';
import { ComparisonsService } from './comparisons/comparisons.service';
import { PrismaService } from './database/prisma.service';
import { ScenariosController } from './scenarios/scenarios.controller';
import { ScenariosService } from './scenarios/scenarios.service';

@Module({
  controllers: [AppController, ScenariosController, ComparisonsController],
  providers: [PrismaService, ScenariosService, ComparisonsService],
})
export class AppModule {}
