import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ProductService } from '@invoiceflow/domain';

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

export type CreateProductInput = {
  type: 'product' | 'service';
  name: string;
  description?: string;
  defaultRate?: string;
  unit?: ProductService['unit'];
};

export type UpdateProductInput = CreateProductInput;

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

  async findById(
    businessId: string,
    productId: string,
  ): Promise<ProductService | null> {
    return this.productServiceRepository.findById(productId, businessId);
  }

  async createProduct(
    businessId: string,
    input: CreateProductInput,
  ): Promise<ProductService> {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('Product name is required');
    }

    const product: ProductService = {
      id: randomUUID(),
      businessId,
      type: input.type,
      name,
      description: input.description?.trim() || undefined,
      defaultRate: input.defaultRate?.trim() || undefined,
      unit: input.unit,
    };

    await this.productServiceRepository.save(product);

    return product;
  }

  async updateProduct(
    businessId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductService> {
    const existing = await this.productServiceRepository.findById(
      productId,
      businessId,
    );

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    const updated: ProductService = {
      ...existing,
      type: input.type ?? existing.type,
      name:
        input.name !== undefined
          ? input.name.trim() || existing.name
          : existing.name,
      description:
        input.description !== undefined
          ? input.description.trim() || undefined
          : existing.description,
      defaultRate:
        input.defaultRate !== undefined
          ? input.defaultRate.trim() || undefined
          : existing.defaultRate,
      unit: input.unit ?? existing.unit,
    };

    await this.productServiceRepository.save(updated);

    return updated;
  }
}
