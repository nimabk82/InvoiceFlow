import type { Invoice, InvoiceStatus } from '@invoiceflow/domain';

export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');

export type InvoiceListQuery = Readonly<{
  businessId: string;
  status?: InvoiceStatus;
  cursor?: string;
  limit?: number;
}>;

export type InvoicePage = Readonly<{
  items: readonly Invoice[];
  nextCursor?: string;
}>;

export interface InvoiceRepository {
  findById(id: string, businessId: string): Promise<Invoice | null>;
  list(query: InvoiceListQuery): Promise<InvoicePage>;
  save(invoice: Invoice): Promise<void>;
}
