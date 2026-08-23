import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../config/environment';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { DisabledEmailProvider } from './disabled-email-provider';
import { EMAIL_DISPATCHER } from './email-dispatcher';
import { EmailDispatcherService } from './email-dispatcher.service';
import { EMAIL_PROVIDER } from './email-provider';
import {
  EMAIL_OUTBOX_POLL_INTERVAL_MS,
  EmailOutboxPoller,
} from './email-outbox-poller';
import { LoggerEmailProvider } from './logger-email-provider';
import { RESEND_FETCH, ResendEmailProvider } from './resend-email-provider';
import { EMAIL_OUTBOX_REPOSITORY } from './repositories/email-outbox.repository';
import { SupabaseEmailOutboxRepository } from './repositories/supabase-email-outbox.repository';

@Module({
  imports: [ConfigModule, SupabaseModule],
  providers: [
    DisabledEmailProvider,
    LoggerEmailProvider,
    ResendEmailProvider,
    { provide: RESEND_FETCH, useValue: globalThis.fetch },
    {
      provide: EMAIL_PROVIDER,
      inject: [
        ConfigService,
        DisabledEmailProvider,
        LoggerEmailProvider,
        ResendEmailProvider,
      ],
      useFactory: (
        config: ConfigService<EnvironmentVariables, true>,
        disabled: DisabledEmailProvider,
        logger: LoggerEmailProvider,
        resend: ResendEmailProvider,
      ) => {
        const provider = config.get('EMAIL_PROVIDER', { infer: true });
        if (provider === 'logger') return logger;
        if (provider === 'resend') return resend;
        return disabled;
      },
    },
    {
      provide: 'EMAIL_PROVIDER_NAME',
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        String(config.get('EMAIL_PROVIDER', { infer: true })),
    },
    {
      provide: EMAIL_OUTBOX_REPOSITORY,
      useClass: SupabaseEmailOutboxRepository,
    },
    EmailDispatcherService,
    { provide: EMAIL_DISPATCHER, useExisting: EmailDispatcherService },
    { provide: EMAIL_OUTBOX_POLL_INTERVAL_MS, useValue: 5_000 },
    EmailOutboxPoller,
  ],
  exports: [EMAIL_DISPATCHER],
})
export class EmailModule {}
