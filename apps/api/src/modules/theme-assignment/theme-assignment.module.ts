import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ThemesModule } from '../themes/themes.module';
import { ThemeAssignmentService } from './theme-assignment.service';

@Module({
  imports: [BusinessesModule, ThemesModule, SupabaseModule],
  providers: [ThemeAssignmentService],
  exports: [ThemeAssignmentService],
})
export class ThemeAssignmentModule {}
