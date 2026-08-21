import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { DocumentDefaultsController } from './document-defaults.controller';
import { DocumentDefaultsService } from './document-defaults.service';
import { DOCUMENT_DEFAULTS_REPOSITORY } from './repositories/document-defaults.repository';
import { SupabaseDocumentDefaultsRepository } from './repositories/supabase-document-defaults.repository';

@Module({
  imports: [AuthModule, BusinessAccessModule, BusinessesModule, SupabaseModule],
  controllers: [DocumentDefaultsController],
  providers: [
    DocumentDefaultsService,
    {
      provide: DOCUMENT_DEFAULTS_REPOSITORY,
      useClass: SupabaseDocumentDefaultsRepository,
    },
  ],
  exports: [DOCUMENT_DEFAULTS_REPOSITORY],
})
export class DocumentDefaultsModule {}
