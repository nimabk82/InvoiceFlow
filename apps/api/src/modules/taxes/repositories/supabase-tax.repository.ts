import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tax } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { TaxRepository } from './tax.repository';

type TaxRow = {
  id: string;
  business_id: string;
  name: string;
  rate: string;
  registration_number: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

type Database = {
  public: {
    Tables: {
      taxes: {
        Row: TaxRow;
        Insert: TaxRow;
        Update: Partial<TaxRow>;
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
export class SupabaseTaxRepository implements TaxRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(id: string, businessId: string): Promise<Tax | null> {
    const { data, error } = await this.client
      .from('taxes')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
  }

  async listByBusiness(businessId: string): Promise<Tax[]> {
    const { data, error } = await this.client
      .from('taxes')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapRow);
  }

  async save(tax: Tax): Promise<void> {
    const { error } = await this.client.from('taxes').upsert({
      id: tax.id,
      business_id: tax.businessId,
      name: tax.name,
      rate: tax.rate,
      registration_number: tax.registrationNumber ?? null,
      is_default: tax.isDefault,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

function mapRow(row: TaxRow): Tax {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    rate: String(row.rate),
    registrationNumber: row.registration_number ?? undefined,
    isDefault: row.is_default,
  };
}
