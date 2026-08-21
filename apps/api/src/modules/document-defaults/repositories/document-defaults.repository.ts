import type { DocumentDefaults } from '@invoiceflow/domain';

export const DOCUMENT_DEFAULTS_REPOSITORY = Symbol(
  'DOCUMENT_DEFAULTS_REPOSITORY',
);

export interface DocumentDefaultsRepository {
  findByBusiness(businessId: string): Promise<DocumentDefaults | null>;
  save(defaults: DocumentDefaults): Promise<void>;
}
