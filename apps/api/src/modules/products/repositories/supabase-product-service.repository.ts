import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductService } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type {
  ProductServicePage,
  ProductServiceRepository,
} from './product-service.repository';

type ProductServiceRow = {
  id: string;
  business_id: string;
  type: 'product' | 'service';
  name: string;
  description: string | null;
  default_rate: string | null;
  unit: string | null;
  default_tax_ids: string[] | null;
  archived_at: string | null;
};

type Database = {
  public: {
    Tables: {
      product_services: {
        Row: ProductServiceRow;
        Insert: ProductServiceRow;
        Update: Partial<ProductServiceRow>;
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
export class SupabaseProductServiceRepository implements ProductServiceRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(
    id: string,
    businessId: string,
  ): Promise<ProductService | null> {
    const { data, error } = await this.client
      .from('product_services')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
  }

  async list(query: {
    businessId: string;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
  }): Promise<ProductServicePage> {
    const limit = query.limit ?? 50;
    let builder = this.client
      .from('product_services')
      .select('*')
      .eq('business_id', query.businessId);

    if (query.includeArchived !== true) {
      builder = builder.is('archived_at', null);
    }

    if (query.search) {
      const search = `%${query.search}%`;
      builder = builder.or(`name.ilike.${search},description.ilike.${search}`);
    }

    builder = builder.order('created_at', { ascending: true }).limit(limit);

    const { data, error } = await builder;

    if (error) {
      throw new Error(error.message);
    }

    return { items: (data ?? []).map(mapRow) };
  }

  async save(productService: ProductService): Promise<void> {
    const { error } = await this.client
      .from('product_services')
      .upsert(mapToRow(productService));

    if (error) {
      throw new Error(error.message);
    }
  }
}

function mapRow(row: ProductServiceRow): ProductService {
  return {
    id: row.id,
    businessId: row.business_id,
    type: row.type,
    name: row.name,
    description: row.description ?? undefined,
    defaultRate: row.default_rate ?? undefined,
    unit: row.unit as ProductService['unit'],
    defaultTaxIds: row.default_tax_ids ?? undefined,
    archivedAt: row.archived_at ?? undefined,
  };
}

function mapToRow(productService: ProductService): ProductServiceRow {
  return {
    id: productService.id,
    business_id: productService.businessId,
    type: productService.type,
    name: productService.name,
    description: productService.description ?? null,
    default_rate: productService.defaultRate ?? null,
    unit: productService.unit ?? null,
    default_tax_ids: productService.defaultTaxIds ?? null,
    archived_at: productService.archivedAt ?? null,
  };
}
