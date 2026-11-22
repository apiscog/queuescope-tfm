import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './database/prisma.service';
import { ScenariosController } from './scenarios/scenarios.controller';
import { ScenariosService } from './scenarios/scenarios.service';

@Module({
  controllers: [AppController, ScenariosController],
  providers: [PrismaService, ScenariosService],
})
export class AppModule {}
