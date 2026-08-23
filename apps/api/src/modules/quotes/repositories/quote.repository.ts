import type { Invoice, Quote, QuoteStatus } from '@invoiceflow/domain';
import type { DocumentEmail } from '../../email/repositories/email-outbox.repository';

export const QUOTE_REPOSITORY = Symbol('QUOTE_REPOSITORY');

export type QuoteListQuery = Readonly<{
  businessId: string;
  status?: QuoteStatus;
  cursor?: string;
  limit?: number;
}>;

export type QuotePage = Readonly<{
  items: readonly Quote[];
  nextCursor?: string;
}>;

export interface QuoteRepository {
  findById(id: string, businessId: string): Promise<Quote | null>;
  list(query: QuoteListQuery): Promise<QuotePage>;
  save(quote: Quote): Promise<void>;
  markSentAndEnqueue(
    id: string,
    businessId: string,
    sentAt: string,
    email: DocumentEmail,
  ): Promise<string | null>;
  convertToInvoice(quote: Quote, invoice: Invoice): Promise<boolean>;
}
