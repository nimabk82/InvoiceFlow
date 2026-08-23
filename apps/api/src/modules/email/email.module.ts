import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../config/environment';
import { DisabledEmailProvider } from './disabled-email-provider';
import { EMAIL_PROVIDER } from './email-provider';
import { LoggerEmailProvider } from './logger-email-provider';

@Module({
  imports: [ConfigModule],
  providers: [
    DisabledEmailProvider,
    LoggerEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, DisabledEmailProvider, LoggerEmailProvider],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        disabled: DisabledEmailProvider,
        logger: LoggerEmailProvider,
      ) =>
        config.get('EMAIL_PROVIDER', { infer: true }) === 'logger'
          ? logger
          : disabled,
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
