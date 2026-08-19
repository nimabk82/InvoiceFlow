import type { ProductService } from '@invoiceflow/domain';

export const PRODUCT_SERVICE_REPOSITORY = Symbol('PRODUCT_SERVICE_REPOSITORY');

export type ProductServiceListQuery = Readonly<{
  businessId: string;
  search?: string;
  includeArchived?: boolean;
  cursor?: string;
  limit?: number;
}>;

export type ProductServicePage = Readonly<{
  items: readonly ProductService[];
  nextCursor?: string;
}>;

export interface ProductServiceRepository {
  findById(id: string, businessId: string): Promise<ProductService | null>;
  list(query: ProductServiceListQuery): Promise<ProductServicePage>;
  save(productService: ProductService): Promise<void>;
}
