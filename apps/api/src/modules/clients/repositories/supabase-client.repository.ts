import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Client, ClientEmail } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { ClientPage, ClientRepository } from './client.repository';

type ClientRow = {
  id: string;
  business_id: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_address_city: string | null;
  billing_address_region: string | null;
  billing_address_postal_code: string | null;
  billing_address_country_code: string | null;
  tax_number: string | null;
  internal_note: string | null;
  archived_at: string | null;
};

type ClientEmailRow = {
  id: string;
  client_id: string;
  address: string;
  is_primary: boolean;
};

type Database = {
  public: {
    Tables: {
      clients: {
        Row: ClientRow;
        Insert: ClientRow;
        Update: Partial<ClientRow>;
        Relationships: [];
      };
      client_emails: {
        Row: ClientEmailRow;
        Insert: ClientEmailRow;
        Update: Partial<ClientEmailRow>;
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
export class SupabaseClientRepository implements ClientRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(id: string, businessId: string): Promise<Client | null> {
    const { data, error } = await this.client
      .from('clients')
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

    const emails = await this.loadEmails([data.id]);
    return mapClient(data, emails.get(data.id) ?? []);
  }

  async list(query: {
    businessId: string;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
  }): Promise<ClientPage> {
    const limit = query.limit ?? 50;
    let builder = this.client
      .from('clients')
      .select('*')
      .eq('business_id', query.businessId);

    if (query.includeArchived !== true) {
      builder = builder.is('archived_at', null);
    }

    if (query.search) {
      const search = `%${query.search}%`;
      builder = builder.or(`name.ilike.${search},company.ilike.${search}`);
    }

    builder = builder.order('created_at', { ascending: true }).limit(limit);

    const { data, error } = await builder;

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    const emails = await this.loadEmails(rows.map((row) => row.id));

    return {
      items: rows.map((row) => mapClient(row, emails.get(row.id) ?? [])),
    };
  }

  async save(client: Client): Promise<void> {
    const { error } = await this.client
      .from('clients')
      .upsert(mapClientToRow(client));

    if (error) {
      throw new Error(error.message);
    }

    const { error: deleteError } = await this.client
      .from('client_emails')
      .delete()
      .eq('client_id', client.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (client.emails.length === 0) {
      return;
    }

    const { error: insertError } = await this.client
      .from('client_emails')
      .insert(
        client.emails.map((email) => ({
          id: email.id,
          client_id: client.id,
          address: email.address,
          is_primary: email.isPrimary,
        })),
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  private async loadEmails(
    clientIds: string[],
  ): Promise<Map<string, ClientEmail[]>> {
    if (clientIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.client
      .from('client_emails')
      .select('*')
      .in('client_id', clientIds);

    if (error) {
      throw new Error(error.message);
    }

    const byClient = new Map<string, ClientEmail[]>();

    for (const email of data ?? []) {
      const list = byClient.get(email.client_id) ?? [];
      list.push({
        id: email.id,
        address: email.address,
        isPrimary: email.is_primary,
      });
      byClient.set(email.client_id, list);
    }

    return byClient;
  }
}

function mapClient(row: ClientRow, emails: ClientEmail[]): Client {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name ?? undefined,
    company: row.company ?? undefined,
    emails,
    phone: row.phone ?? undefined,
    billingAddress: row.billing_address_line1
      ? {
          line1: row.billing_address_line1,
          line2: row.billing_address_line2 ?? undefined,
          city: row.billing_address_city ?? undefined,
          region: row.billing_address_region ?? undefined,
          postalCode: row.billing_address_postal_code ?? undefined,
          countryCode: row.billing_address_country_code ?? undefined,
        }
      : undefined,
    taxNumber: row.tax_number ?? undefined,
    internalNote: row.internal_note ?? undefined,
    archivedAt: row.archived_at ?? undefined,
  };
}

function mapClientToRow(client: Client): ClientRow {
  return {
    id: client.id,
    business_id: client.businessId,
    name: client.name ?? null,
    company: client.company ?? null,
    phone: client.phone ?? null,
    billing_address_line1: client.billingAddress?.line1 ?? null,
    billing_address_line2: client.billingAddress?.line2 ?? null,
    billing_address_city: client.billingAddress?.city ?? null,
    billing_address_region: client.billingAddress?.region ?? null,
    billing_address_postal_code: client.billingAddress?.postalCode ?? null,
    billing_address_country_code: client.billingAddress?.countryCode ?? null,
    tax_number: client.taxNumber ?? null,
    internal_note: client.internalNote ?? null,
    archived_at: client.archivedAt ?? null,
  };
}
