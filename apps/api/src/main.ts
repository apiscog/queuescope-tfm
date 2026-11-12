import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  app.enableCors({ origin: corsOrigin });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QueueScope API')
    .setDescription('API REST de la plataforma QueueScope')
    .setVersion('0.0.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  await app.listen(port);
}

void bootstrap();
