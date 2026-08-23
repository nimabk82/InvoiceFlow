import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppliedTax,
  BusinessSnapshot,
  ClientSnapshot,
  DepositTerms,
  DocumentItem,
  Invoice,
  Quote,
  QuoteStatus,
  RichTextDocument,
} from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { DocumentEmail } from '../../email/repositories/email-outbox.repository';
import type { QuotePage, QuoteRepository } from './quote.repository';

type QuoteRow = {
  id: string;
  business_id: string;
  number: string;
  client_id: string | null;
  client_snapshot: ClientSnapshot;
  business_snapshot: BusinessSnapshot;
  currency_code: string;
  issue_date: string;
  valid_until: string | null;
  proposed_deposit_terms: DepositTerms | null;
  notes: RichTextDocument | null;
  terms: RichTextDocument | null;
  status: QuoteStatus;
  theme_id: string | null;
  theme_version_id: string | null;
  theme_name_snapshot: string | null;
  converted_invoice_ids: string[];
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

type DocumentItemRow = {
  id: string;
  document_type: string;
  document_id: string;
  source_product_service_id: string | null;
  description: string;
  secondary_description: string | null;
  quantity: string;
  rate: string;
  sort_order: number;
};

type DocumentItemTaxRow = {
  id?: string;
  item_id: string;
  tax_id: string | null;
  name: string;
  rate: string;
};

type AggregateItemRow = DocumentItemRow & {
  taxes: Omit<DocumentItemTaxRow, 'id' | 'item_id'>[];
};

type Database = {
  public: {
    Tables: {
      quotes: {
        Row: QuoteRow;
        Insert: QuoteRow;
        Update: Partial<QuoteRow>;
        Relationships: [];
      };
      document_items: {
        Row: DocumentItemRow;
        Insert: DocumentItemRow;
        Update: Partial<DocumentItemRow>;
        Relationships: [];
      };
      document_item_taxes: {
        Row: DocumentItemTaxRow;
        Insert: DocumentItemTaxRow;
        Update: Partial<DocumentItemTaxRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_quote_aggregate: {
        Args: { p_quote: QuoteRow; p_items: AggregateItemRow[] };
        Returns: undefined;
      };
      send_quote_and_enqueue_email: {
        Args: {
          p_quote_id: string;
          p_business_id: string;
          p_sent_at: string;
          p_command_key: string;
          p_to_addresses: readonly string[];
          p_cc_addresses: readonly string[];
          p_bcc_addresses: readonly string[];
          p_subject: string;
          p_text_body: string | null;
        };
        Returns: string | null;
      };
      convert_quote_to_invoice: {
        Args: {
          p_quote_id: string;
          p_business_id: string;
          p_expected_updated_at: string;
          p_quote_updated_at: string;
          p_invoice: Record<string, unknown>;
          p_items: AggregateItemRow[];
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class SupabaseQuoteRepository implements QuoteRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(id: string, businessId: string): Promise<Quote | null> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    const items = await this.loadItems([data.id]);
    return mapQuote(data, items.get(data.id) ?? []);
  }

  async list(query: {
    businessId: string;
    status?: QuoteStatus;
    limit?: number;
  }): Promise<QuotePage> {
    const limit = query.limit ?? 50;
    let builder = this.client
      .from('quotes')
      .select('*')
      .eq('business_id', query.businessId);

    if (query.status) {
      builder = builder.eq('status', query.status);
    }

    builder = builder.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await builder;

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    const itemsByQuote = await this.loadItems(rows.map((row) => row.id));

    return {
      items: rows.map((row) => mapQuote(row, itemsByQuote.get(row.id) ?? [])),
    };
  }

  async save(quote: Quote): Promise<void> {
    const { error } = await this.client.rpc('save_quote_aggregate', {
      p_quote: mapQuoteToRow(quote),
      p_items: mapAggregateItems(quote, 'quote'),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async markSentAndEnqueue(
    id: string,
    businessId: string,
    sentAt: string,
    email: DocumentEmail,
  ): Promise<string | null> {
    const { data, error } = await this.client.rpc(
      'send_quote_and_enqueue_email',
      {
        p_quote_id: id,
        p_business_id: businessId,
        p_sent_at: sentAt,
        p_command_key: email.commandKey,
        p_to_addresses: email.to,
        p_cc_addresses: email.cc,
        p_bcc_addresses: email.bcc,
        p_subject: email.subject,
        p_text_body: email.text ?? null,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async convertToInvoice(quote: Quote, invoice: Invoice): Promise<boolean> {
    const { data, error } = await this.client.rpc('convert_quote_to_invoice', {
      p_quote_id: quote.id,
      p_business_id: quote.businessId,
      p_expected_updated_at: quote.updatedAt,
      p_quote_updated_at: invoice.updatedAt,
      p_invoice: mapInvoiceToRpcRow(invoice),
      p_items: mapAggregateItems(invoice, 'invoice'),
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private async loadItems(
    quoteIds: string[],
  ): Promise<Map<string, DocumentItem[]>> {
    if (quoteIds.length === 0) {
      return new Map();
    }

    const { data: itemRows, error: itemError } = await this.client
      .from('document_items')
      .select('*')
      .eq('document_type', 'quote')
      .in('document_id', quoteIds)
      .order('sort_order', { ascending: true });

    if (itemError) {
      throw new Error(itemError.message);
    }

    const items = itemRows ?? [];
    const taxesByItem = await this.loadItemTaxes(items.map((item) => item.id));

    const itemsByQuote = new Map<string, DocumentItem[]>();

    for (const item of items) {
      const list = itemsByQuote.get(item.document_id) ?? [];
      list.push(mapItem(item, taxesByItem.get(item.id) ?? []));
      itemsByQuote.set(item.document_id, list);
    }

    return itemsByQuote;
  }

  private async loadItemTaxes(
    itemIds: string[],
  ): Promise<Map<string, AppliedTax[]>> {
    if (itemIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from('document_item_taxes')
      .select('*')
      .in('item_id', itemIds);

    if (error) {
      throw new Error(error.message);
    }

    const taxesByItem = new Map<string, AppliedTax[]>();

    for (const tax of data ?? []) {
      const list = taxesByItem.get(tax.item_id) ?? [];
      list.push({
        taxId: tax.tax_id ?? undefined,
        name: tax.name,
        rate: tax.rate,
      });
      taxesByItem.set(tax.item_id, list);
    }

    return taxesByItem;
  }
}

function mapItem(row: DocumentItemRow, taxes: AppliedTax[]): DocumentItem {
  return {
    id: row.id,
    sourceProductServiceId: row.source_product_service_id ?? undefined,
    description: row.description,
    secondaryDescription: row.secondary_description ?? undefined,
    quantity: String(row.quantity),
    rate: String(row.rate),
    appliedTaxes: taxes,
  };
}

function mapItemToRow(
  item: DocumentItem,
  documentId: string,
  sortOrder: number,
  documentType: 'invoice' | 'quote' = 'quote',
): DocumentItemRow {
  return {
    id: item.id,
    document_type: documentType,
    document_id: documentId,
    source_product_service_id: item.sourceProductServiceId ?? null,
    description: item.description,
    secondary_description: item.secondaryDescription ?? null,
    quantity: item.quantity,
    rate: item.rate,
    sort_order: sortOrder,
  };
}

function mapAggregateItems(
  document: Quote | Invoice,
  documentType: 'invoice' | 'quote',
): AggregateItemRow[] {
  return document.items.map((item, index) => ({
    ...mapItemToRow(item, document.id, index, documentType),
    taxes: item.appliedTaxes.map((tax) => ({
      tax_id: tax.taxId ?? null,
      name: tax.name,
      rate: tax.rate,
    })),
  }));
}

function mapInvoiceToRpcRow(invoice: Invoice): Record<string, unknown> {
  return {
    id: invoice.id,
    business_id: invoice.businessId,
    number: invoice.number,
    client_id: invoice.clientId ?? null,
    client_snapshot: invoice.clientSnapshot,
    business_snapshot: invoice.businessSnapshot,
    currency_code: invoice.currencyCode,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate ?? null,
    discount: invoice.discount ?? null,
    deposit_terms: invoice.depositTerms ?? null,
    notes: invoice.notes ?? null,
    terms: invoice.terms ?? null,
    po_number: invoice.poNumber ?? null,
    status: invoice.status,
    source_quote_id: invoice.sourceQuoteId ?? null,
    theme_id: invoice.themeId ?? null,
    theme_version_id: invoice.themeVersionId ?? null,
    theme_name_snapshot: invoice.themeNameSnapshot ?? null,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
    sent_at: invoice.sentAt ?? null,
  };
}

function mapQuote(row: QuoteRow, items: DocumentItem[]): Quote {
  return {
    id: row.id,
    businessId: row.business_id,
    number: row.number,
    clientId: row.client_id ?? undefined,
    clientSnapshot: row.client_snapshot,
    businessSnapshot: row.business_snapshot,
    currencyCode: row.currency_code,
    issueDate: row.issue_date,
    validUntil: row.valid_until ?? undefined,
    items,
    proposedDepositTerms: row.proposed_deposit_terms ?? undefined,
    notes: row.notes ?? undefined,
    terms: row.terms ?? undefined,
    status: row.status,
    themeId: row.theme_id ?? undefined,
    themeVersionId: row.theme_version_id ?? undefined,
    themeNameSnapshot: row.theme_name_snapshot ?? undefined,
    convertedInvoiceIds: row.converted_invoice_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at ?? undefined,
  };
}

function mapQuoteToRow(quote: Quote): QuoteRow {
  return {
    id: quote.id,
    business_id: quote.businessId,
    number: quote.number,
    client_id: quote.clientId ?? null,
    client_snapshot: quote.clientSnapshot,
    business_snapshot: quote.businessSnapshot,
    currency_code: quote.currencyCode,
    issue_date: quote.issueDate,
    valid_until: quote.validUntil ?? null,
    proposed_deposit_terms: quote.proposedDepositTerms ?? null,
    notes: quote.notes ?? null,
    terms: quote.terms ?? null,
    status: quote.status,
    theme_id: quote.themeId ?? null,
    theme_version_id: quote.themeVersionId ?? null,
    theme_name_snapshot: quote.themeNameSnapshot ?? null,
    converted_invoice_ids: quote.convertedInvoiceIds,
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
    sent_at: quote.sentAt ?? null,
  };
}
