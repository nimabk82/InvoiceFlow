import type { BusinessSnapshot } from './business.js';
import type { ClientSnapshot } from './client.js';
import type { Money, Decimal } from './money.js';

export type RichTextBlock = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: readonly RichTextBlock[];
  marks?: readonly unknown[];
};

export type RichTextDocument = {
  type: 'doc';
  content: readonly RichTextBlock[];
};

export type AppliedTax = {
  taxId?: string;
  name: string;
  rate: Decimal;
};

export type DocumentDiscount =
  | {
      type: 'percentage';
      value: Decimal;
    }
  | {
      type: 'fixed';
      value: Money;
    };

export type DepositDueRule = 'on_receipt' | 'days_7' | 'days_15' | 'custom';

export type DepositTerms =
  | {
      type: 'percentage';
      value: Decimal;
      dueRule: DepositDueRule;
      dueDate?: string;
    }
  | {
      type: 'fixed';
      value: Money;
      dueRule: DepositDueRule;
      dueDate?: string;
    };

export type DocumentItem = {
  id: string;
  sourceProductServiceId?: string;
  description: string;
  secondaryDescription?: string;
  quantity: Decimal;
  rate: Money;
  appliedTaxes: AppliedTax[];
};

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void';

export type Invoice = {
  id: string;
  businessId: string;
  number: string;
  clientId?: string;
  clientSnapshot: ClientSnapshot;
  businessSnapshot: BusinessSnapshot;
  currencyCode: string;
  issueDate: string;
  dueDate?: string;
  items: DocumentItem[];
  discount?: DocumentDiscount;
  depositTerms?: DepositTerms;
  notes?: RichTextDocument;
  terms?: RichTextDocument;
  poNumber?: string;
  status: InvoiceStatus;
  sourceQuoteId?: string;
  themeId?: string;
  themeVersionId?: string;
  themeNameSnapshot?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
};

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired';

export type Quote = {
  id: string;
  businessId: string;
  number: string;
  clientId?: string;
  clientSnapshot: ClientSnapshot;
  businessSnapshot: BusinessSnapshot;
  currencyCode: string;
  issueDate: string;
  validUntil?: string;
  items: DocumentItem[];
  proposedDepositTerms?: DepositTerms;
  notes?: RichTextDocument;
  terms?: RichTextDocument;
  status: QuoteStatus;
  themeId?: string;
  themeVersionId?: string;
  themeNameSnapshot?: string;
  convertedInvoiceIds: string[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: Money;
  paidAt: string;
  method?: string;
  reference?: string;
};

export type ActivityEventType =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'payment_recorded'
  | 'voided'
  | 'converted';

export type ActivityEvent = {
  id: string;
  businessId: string;
  entityType: 'invoice' | 'quote';
  entityId: string;
  type: ActivityEventType;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};