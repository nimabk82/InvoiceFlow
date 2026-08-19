import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppliedTax,
  BusinessSnapshot,
  ClientSnapshot,
  DepositTerms,
  DocumentDiscount,
  DocumentItem,
  Invoice,
  InvoiceStatus,
  RichTextDocument,
} from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { InvoicePage, InvoiceRepository } from './invoice.repository';

type InvoiceRow = {
  id: string;
  business_id: string;
  number: string;
  client_id: string | null;
  client_snapshot: ClientSnapshot;
  business_snapshot: BusinessSnapshot;
  currency_code: string;
  issue_date: string;
  due_date: string | null;
  discount: DocumentDiscount | null;
  deposit_terms: DepositTerms | null;
  notes: RichTextDocument | null;
  terms: RichTextDocument | null;
  po_number: string | null;
  status: InvoiceStatus;
  source_quote_id: string | null;
  theme_id: string | null;
  theme_version_id: string | null;
  theme_name_snapshot: string | null;
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
  id: string;
  item_id: string;
  tax_id: string | null;
  name: string;
  rate: string;
};

type Database = {
  public: {
    Tables: {
      invoices: {
        Row: InvoiceRow;
        Insert: InvoiceRow;
        Update: Partial<InvoiceRow>;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class SupabaseInvoiceRepository implements InvoiceRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(id: string, businessId: string): Promise<Invoice | null> {
    const { data, error } = await this.client
      .from('invoices')
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
    return mapInvoice(data, items.get(data.id) ?? []);
  }

  async list(query: {
    businessId: string;
    status?: InvoiceStatus;
    limit?: number;
  }): Promise<InvoicePage> {
    const limit = query.limit ?? 50;
    let builder = this.client
      .from('invoices')
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
    const itemsByInvoice = await this.loadItems(rows.map((row) => row.id));

    return {
      items: rows.map((row) =>
        mapInvoice(row, itemsByInvoice.get(row.id) ?? []),
      ),
    };
  }

  async save(invoice: Invoice): Promise<void> {
    const { error } = await this.client
      .from('invoices')
      .upsert(mapInvoiceToRow(invoice));

    if (error) {
      throw new Error(error.message);
    }
  }

  private async loadItems(
    invoiceIds: string[],
  ): Promise<Map<string, DocumentItem[]>> {
    if (invoiceIds.length === 0) {
      return new Map();
    }

    const { data: itemRows, error: itemError } = await this.client
      .from('document_items')
      .select('*')
      .eq('document_type', 'invoice')
      .in('document_id', invoiceIds)
      .order('sort_order', { ascending: true });

    if (itemError) {
      throw new Error(itemError.message);
    }

    const items = itemRows ?? [];
    const taxesByItem = await this.loadItemTaxes(items.map((item) => item.id));

    const itemsByInvoice = new Map<string, DocumentItem[]>();

    for (const item of items) {
      const list = itemsByInvoice.get(item.document_id) ?? [];
      list.push(mapItem(item, taxesByItem.get(item.id) ?? []));
      itemsByInvoice.set(item.document_id, list);
    }

    return itemsByInvoice;
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

function mapInvoice(row: InvoiceRow, items: DocumentItem[]): Invoice {
  return {
    id: row.id,
    businessId: row.business_id,
    number: row.number,
    clientId: row.client_id ?? undefined,
    clientSnapshot: row.client_snapshot,
    businessSnapshot: row.business_snapshot,
    currencyCode: row.currency_code,
    issueDate: row.issue_date,
    dueDate: row.due_date ?? undefined,
    items,
    discount: row.discount ?? undefined,
    depositTerms: row.deposit_terms ?? undefined,
    notes: row.notes ?? undefined,
    terms: row.terms ?? undefined,
    poNumber: row.po_number ?? undefined,
    status: row.status,
    sourceQuoteId: row.source_quote_id ?? undefined,
    themeId: row.theme_id ?? undefined,
    themeVersionId: row.theme_version_id ?? undefined,
    themeNameSnapshot: row.theme_name_snapshot ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at ?? undefined,
  };
}

function mapInvoiceToRow(invoice: Invoice): InvoiceRow {
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
