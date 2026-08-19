import type { Decimal } from './money.js';

export type Tax = {
  id: string;
  businessId: string;
  name: string;
  rate: Decimal;
  registrationNumber?: string;
  isDefault: boolean;
};