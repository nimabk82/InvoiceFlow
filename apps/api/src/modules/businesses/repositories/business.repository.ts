import type { Business } from '@invoiceflow/domain';

export const BUSINESS_REPOSITORY = Symbol('BUSINESS_REPOSITORY');

export interface BusinessRepository {
  findById(id: string): Promise<Business | null>;
  listByOwner(ownerAccountId: string): Promise<Business[]>;
  save(business: Business): Promise<void>;
}
