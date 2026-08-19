import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CLIENT_REPOSITORY } from './repositories/client.repository';
import { SupabaseClientRepository } from './repositories/supabase-client.repository';

@Module({
  imports: [AuthModule, BusinessAccessModule, SupabaseModule],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    {
      provide: CLIENT_REPOSITORY,
      useClass: SupabaseClientRepository,
    },
  ],
  exports: [CLIENT_REPOSITORY],
})
export class ClientsModule {}
