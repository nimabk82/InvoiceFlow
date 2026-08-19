import { Inject, Injectable } from '@nestjs/common';

import {
  PRODUCT_SERVICE_REPOSITORY,
  type ProductServicePage,
  type ProductServiceRepository,
} from './repositories/product-service.repository';

export type ListProductsOptions = {
  search?: string;
  includeArchived?: boolean;
  limit?: number;
};

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_SERVICE_REPOSITORY)
    private readonly productServiceRepository: ProductServiceRepository,
  ) {}

  async list(
    businessId: string,
    options?: ListProductsOptions,
  ): Promise<ProductServicePage> {
    return this.productServiceRepository.list({
      businessId,
      ...options,
    });
  }
}
