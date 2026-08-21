import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { ACTIVITY_EVENT_REPOSITORY } from './repositories/activity-event.repository';
import { SupabaseActivityEventRepository } from './repositories/supabase-activity-event.repository';

@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: ACTIVITY_EVENT_REPOSITORY,
      useClass: SupabaseActivityEventRepository,
    },
  ],
  exports: [ACTIVITY_EVENT_REPOSITORY],
})
export class AuditModule {}
