import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessSettings } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { BusinessSettingsRepository } from './business-settings.repository';

type BusinessSettingsRow = {
  business_id: string;
  bank_transfer_instructions: string | null;
  cheque_instructions: string | null;
  invoice_prefix: string | null;
  next_invoice_number: number | null;
  quote_prefix: string | null;
  next_quote_number: number | null;
  accent_color: string | null;
  style: string | null;
  created_at?: string;
  updated_at?: string;
};

type Database = {
  public: {
    Tables: {
      business_settings: {
        Row: BusinessSettingsRow;
        Insert: BusinessSettingsRow;
        Update: Partial<BusinessSettingsRow>;
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
export class SupabaseBusinessSettingsRepository implements BusinessSettingsRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findByBusiness(businessId: string): Promise<BusinessSettings | null> {
    const { data, error } = await this.client
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
  }

  async save(settings: BusinessSettings): Promise<void> {
    const { error } = await this.client.from('business_settings').upsert({
      business_id: settings.businessId,
      bank_transfer_instructions: settings.bankTransferInstructions ?? null,
      cheque_instructions: settings.chequeInstructions ?? null,
      invoice_prefix: settings.invoicePrefix ?? null,
      next_invoice_number: settings.nextInvoiceNumber ?? null,
      quote_prefix: settings.quotePrefix ?? null,
      next_quote_number: settings.nextQuoteNumber ?? null,
      accent_color: settings.accentColor ?? null,
      style: settings.style ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

function mapRow(row: BusinessSettingsRow): BusinessSettings {
  return {
    businessId: row.business_id,
    bankTransferInstructions: row.bank_transfer_instructions ?? undefined,
    chequeInstructions: row.cheque_instructions ?? undefined,
    invoicePrefix: row.invoice_prefix ?? undefined,
    nextInvoiceNumber: row.next_invoice_number ?? undefined,
    quotePrefix: row.quote_prefix ?? undefined,
    nextQuoteNumber: row.next_quote_number ?? undefined,
    accentColor: row.accent_color ?? undefined,
    style: row.style ?? undefined,
  };
}
