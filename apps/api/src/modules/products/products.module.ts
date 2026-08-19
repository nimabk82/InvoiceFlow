import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessAccessModule } from '../businesses/access/business-access.module';
import { PRODUCT_SERVICE_REPOSITORY } from './repositories/product-service.repository';
import { SupabaseProductServiceRepository } from './repositories/supabase-product-service.repository';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, BusinessAccessModule, SupabaseModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    {
      provide: PRODUCT_SERVICE_REPOSITORY,
      useClass: SupabaseProductServiceRepository,
    },
  ],
  exports: [PRODUCT_SERVICE_REPOSITORY],
})
export class ProductsModule {}
