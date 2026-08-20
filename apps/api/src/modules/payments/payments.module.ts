import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { PAYMENT_REPOSITORY } from './repositories/payment.repository';
import { SupabasePaymentRepository } from './repositories/supabase-payment.repository';

@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: PAYMENT_REPOSITORY,
      useClass: SupabasePaymentRepository,
    },
  ],
  exports: [PAYMENT_REPOSITORY],
})
export class PaymentsModule {}
