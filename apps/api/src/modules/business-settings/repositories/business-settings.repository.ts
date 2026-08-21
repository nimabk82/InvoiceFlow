import type { BusinessSettings } from '@invoiceflow/domain';

export const BUSINESS_SETTINGS_REPOSITORY = Symbol(
  'BUSINESS_SETTINGS_REPOSITORY',
);

export interface BusinessSettingsRepository {
  findByBusiness(businessId: string): Promise<BusinessSettings | null>;
  save(settings: BusinessSettings): Promise<void>;
}
