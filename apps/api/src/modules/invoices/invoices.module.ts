import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ClientsModule } from '../clients/clients.module';
import { EmailModule } from '../email/email.module';
import { INVOICE_REPOSITORY } from './repositories/invoice.repository';
import { SupabaseInvoiceRepository } from './repositories/supabase-invoice.repository';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    AuthModule,
    BusinessAccessModule,
    BusinessesModule,
    ClientsModule,
    EmailModule,
    SupabaseModule,
  ],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: SupabaseInvoiceRepository,
    },
  ],
  exports: [INVOICE_REPOSITORY],
})
export class InvoicesModule {}
