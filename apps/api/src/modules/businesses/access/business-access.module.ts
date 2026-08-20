import { forwardRef, Module } from '@nestjs/common';

import { BusinessesModule } from '../businesses.module';
import { BusinessAccessGuard } from './business-access.guard';
import { BusinessAccessService } from './business-access.service';

@Module({
  imports: [forwardRef(() => BusinessesModule)],
  providers: [BusinessAccessService, BusinessAccessGuard],
  exports: [BusinessAccessService, BusinessAccessGuard],
})
export class BusinessAccessModule {}
