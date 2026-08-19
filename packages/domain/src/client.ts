import type { Address } from './business.js';

export type ClientEmail = {
  id: string;
  address: string;
  isPrimary: boolean;
};

export type Client = {
  id: string;
  businessId: string;
  name?: string;
  company?: string;
  emails: ClientEmail[];
  phone?: string;
  billingAddress?: Address;
  taxNumber?: string;
  internalNote?: string;
  archivedAt?: string;
};

export type ClientSnapshot = {
  displayName: string;
  emails: string[];
  phone?: string;
  address?: Address;
  taxNumber?: string;
};