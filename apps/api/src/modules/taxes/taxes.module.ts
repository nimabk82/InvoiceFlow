import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { TAX_REPOSITORY } from './repositories/tax.repository';
import { SupabaseTaxRepository } from './repositories/supabase-tax.repository';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';

@Module({
  imports: [AuthModule, BusinessAccessModule, SupabaseModule],
  controllers: [TaxesController],
  providers: [
    TaxesService,
    {
      provide: TAX_REPOSITORY,
      useClass: SupabaseTaxRepository,
    },
  ],
  exports: [TAX_REPOSITORY],
})
export class TaxesModule {}
