import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

import type { EnvironmentVariables } from '../../config/environment';
import { SUPABASE_CLIENT } from './supabase-client.token';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        createClient(
          config.get('SUPABASE_URL', { infer: true }),
          config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true }),
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          },
        ),
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
