import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { BusinessSettingsController } from './business-settings.controller';
import { BusinessSettingsService } from './business-settings.service';
import { BUSINESS_SETTINGS_REPOSITORY } from './repositories/business-settings.repository';
import { SupabaseBusinessSettingsRepository } from './repositories/supabase-business-settings.repository';

@Module({
  imports: [AuthModule, BusinessAccessModule, BusinessesModule, SupabaseModule],
  controllers: [BusinessSettingsController],
  providers: [
    BusinessSettingsService,
    {
      provide: BUSINESS_SETTINGS_REPOSITORY,
      useClass: SupabaseBusinessSettingsRepository,
    },
  ],
  exports: [BUSINESS_SETTINGS_REPOSITORY],
})
export class BusinessSettingsModule {}
