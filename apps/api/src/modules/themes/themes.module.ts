import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { THEME_REPOSITORY } from './repositories/theme.repository';
import { SupabaseThemeRepository } from './repositories/supabase-theme.repository';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';

@Module({
  imports: [AuthModule, BusinessAccessModule, BusinessesModule, SupabaseModule],
  controllers: [ThemesController],
  providers: [
    ThemesService,
    {
      provide: THEME_REPOSITORY,
      useClass: SupabaseThemeRepository,
    },
  ],
  exports: [THEME_REPOSITORY],
})
export class ThemesModule {}
