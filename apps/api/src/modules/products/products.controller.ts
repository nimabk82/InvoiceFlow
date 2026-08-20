import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth';
import { BusinessAccessGuard } from '../businesses/access';
import type {
  CreateProductInput,
  ListProductsOptions,
  UpdateProductInput,
} from './products.service';
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

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() input: CreateProductInput,
  ) {
    return this.productsService.createProduct(businessId, input);
  }

  @Get(':productId')
  findOne(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.findById(businessId, productId);
  }

  @Patch(':productId')
  update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() input: UpdateProductInput,
  ) {
    return this.productsService.updateProduct(businessId, productId, input);
  }
}
