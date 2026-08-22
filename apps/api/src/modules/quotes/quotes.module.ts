import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ClientsModule } from '../clients/clients.module';
import { EmailModule } from '../email/email.module';
import { QUOTE_REPOSITORY } from './repositories/quote.repository';
import { SupabaseQuoteRepository } from './repositories/supabase-quote.repository';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    BusinessAccessModule,
    BusinessesModule,
    ClientsModule,
    EmailModule,
    SupabaseModule,
  ],
  controllers: [QuotesController],
  providers: [
    QuotesService,
    {
      provide: QUOTE_REPOSITORY,
      useClass: SupabaseQuoteRepository,
    },
  ],
  exports: [QUOTE_REPOSITORY],
})
export class QuotesModule {}
