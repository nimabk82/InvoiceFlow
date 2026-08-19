import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthGuard } from './auth.guard';
import { AUTHENTICATION } from './authentication';
import { SupabaseAuthentication } from './supabase-authentication';

@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: AUTHENTICATION,
      useClass: SupabaseAuthentication,
    },
    AuthGuard,
  ],
  exports: [AUTHENTICATION, AuthGuard],
})
export class AuthModule {}
