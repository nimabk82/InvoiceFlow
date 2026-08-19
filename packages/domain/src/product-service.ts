import type { Money } from './money.js';

export type ProductServiceType = 'product' | 'service';

export type ProductServiceUnit =
  | 'fixed'
  | 'hour'
  | 'day'
  | 'unit'
  | 'month'
  | 'project';

export type ProductService = {
  id: string;
  businessId: string;
  type: ProductServiceType;
  name: string;
  description?: string;
  defaultRate?: Money;
  unit?: ProductServiceUnit;
  defaultTaxIds?: string[];
  archivedAt?: string;
};