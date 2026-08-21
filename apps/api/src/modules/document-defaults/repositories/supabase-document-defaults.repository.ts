import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentDefaults } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { DocumentDefaultsRepository } from './document-defaults.repository';

type DocumentDefaultsRow = {
  business_id: string;
  default_due_rule: string | null;
  default_notes: string | null;
  default_terms: string | null;
  default_invoice_theme_id: string | null;
  default_quote_theme_id: string | null;
  default_tax_ids: string[] | null;
  created_at?: string;
  updated_at?: string;
};

type Database = {
  public: {
    Tables: {
      document_defaults: {
        Row: DocumentDefaultsRow;
        Insert: DocumentDefaultsRow;
        Update: Partial<DocumentDefaultsRow>;
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
export class SupabaseDocumentDefaultsRepository implements DocumentDefaultsRepository {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly client: SupabaseClient<Database>,
  ) {}

  async findByBusiness(businessId: string): Promise<DocumentDefaults | null> {
    const { data, error } = await this.client
      .from('document_defaults')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
  }

  async save(defaults: DocumentDefaults): Promise<void> {
    const { error } = await this.client.from('document_defaults').upsert({
      business_id: defaults.businessId,
      default_due_rule: defaults.defaultDueRule ?? null,
      default_notes: defaults.defaultNotes ?? null,
      default_terms: defaults.defaultTerms ?? null,
      default_invoice_theme_id: defaults.defaultInvoiceThemeId ?? null,
      default_quote_theme_id: defaults.defaultQuoteThemeId ?? null,
      default_tax_ids: defaults.defaultTaxIds ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

function mapRow(row: DocumentDefaultsRow): DocumentDefaults {
  return {
    businessId: row.business_id,
    defaultDueRule: row.default_due_rule ?? undefined,
    defaultNotes: row.default_notes ?? undefined,
    defaultTerms: row.default_terms ?? undefined,
    defaultInvoiceThemeId: row.default_invoice_theme_id ?? undefined,
    defaultQuoteThemeId: row.default_quote_theme_id ?? undefined,
    defaultTaxIds: row.default_tax_ids ?? undefined,
  };
}
