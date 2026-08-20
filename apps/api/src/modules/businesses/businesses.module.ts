import { forwardRef, Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from './access/business-access.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BUSINESS_REPOSITORY } from './repositories/business.repository';
import { SupabaseBusinessRepository } from './repositories/supabase-business.repository';

@Module({
  imports: [AuthModule, SupabaseModule, forwardRef(() => BusinessAccessModule)],
  controllers: [BusinessesController],
  providers: [
    BusinessesService,
    {
      provide: BUSINESS_REPOSITORY,
      useClass: SupabaseBusinessRepository,
    },
  ],
  exports: [BUSINESS_REPOSITORY],
})
export class BusinessesModule {}
