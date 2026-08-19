import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type { ListProductsOptions } from './products.service';
import { ProductsService } from './products.service';

@Controller('businesses/:businessId/products')
@UseGuards(AuthGuard, BusinessAccessGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @Param('businessId') businessId: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const options: ListProductsOptions = { search };

    if (includeArchived === 'true') {
      options.includeArchived = true;
    }

    return this.productsService.list(businessId, options);
  }
}
