import type { Tax } from '@invoiceflow/domain';

export const TAX_REPOSITORY = Symbol('TAX_REPOSITORY');

export interface TaxRepository {
  findById(id: string, businessId: string): Promise<Tax | null>;
  listByBusiness(businessId: string): Promise<Tax[]>;
  save(tax: Tax): Promise<void>;
}
