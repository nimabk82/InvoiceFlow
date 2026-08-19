import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { createApplicationLogger } from './common/logging/application-logger';
import type { EnvironmentVariables } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const host = config.get('HOST', { infer: true });
  const port = config.get('PORT', { infer: true });
  const environment = config.get('NODE_ENV', { infer: true });
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });
  const logger = createApplicationLogger(
    config.get('LOG_LEVEL', { infer: true }),
  );

  app.useLogger(logger);
  app.flushLogs();
  app.enableShutdownHooks();

  if (corsOrigins.length > 0) {
    app.enableCors({ origin: [...corsOrigins] });
  }

  await app.listen(port, host);

  logger.log(
    {
      environment,
      event: 'application_started',
      host,
      port,
    },
    'Bootstrap',
  );
}

void bootstrap();
