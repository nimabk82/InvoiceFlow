import { Module } from '@nestjs/common';

import { EMAIL_PROVIDER } from './email-provider';
import { LoggerEmailProvider } from './logger-email-provider';

@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useClass: LoggerEmailProvider,
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
