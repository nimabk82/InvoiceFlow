import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Business } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { BusinessRepository } from './business.repository';

type BusinessRow = {
  id: string;
  owner_account_id: string;
  name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
  address_country_code: string | null;
  country_code: string;
  currency_code: string;
  logo_asset_id: string | null;
  default_invoice_theme_id: string | null;
  default_quote_theme_id: string | null;
};

type Database = {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow;
        Insert: BusinessRow;
        Update: Partial<BusinessRow>;
        Relationships: [];
      };
      business_members: {
        Row: {
          account_id: string;
          business_id: string;
          role: string;
        };
        Insert: {
          account_id: string;
          business_id: string;
          role: string;
        };
        Update: Partial<{
          account_id: string;
          business_id: string;
          role: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      provision_owner_business: {
        Args: ProvisionOwnerBusinessArgs;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class SupabaseBusinessRepository implements BusinessRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(id: string): Promise<Business | null> {
    if (!isUuid(id)) {
      return null;
    }

    const { data, error } = await this.client
      .from('businesses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
  }

  async listByOwner(ownerAccountId: string): Promise<Business[]> {
    const { data, error } = await this.client
      .from('businesses')
      .select('*')
      .eq('owner_account_id', ownerAccountId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapRow);
  }

  async isMember(accountId: string, businessId: string): Promise<boolean> {
    if (!isUuid(accountId) || !isUuid(businessId)) {
      return false;
    }

    const { data, error } = await this.client
      .from('business_members')
      .select('account_id')
      .eq('account_id', accountId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data !== null;
  }

  async provisionOwnerBusiness(business: Business): Promise<void> {
    const row = mapToRow(business);
    const { error } = await this.client.rpc('provision_owner_business', {
      p_address_city: row.address_city,
      p_address_country_code: row.address_country_code,
      p_address_line1: row.address_line1,
      p_address_line2: row.address_line2,
      p_address_postal_code: row.address_postal_code,
      p_address_region: row.address_region,
      p_business_id: row.id,
      p_country_code: row.country_code,
      p_currency_code: row.currency_code,
      p_email: row.email,
      p_legal_name: row.legal_name,
      p_logo_asset_id: row.logo_asset_id,
      p_name: row.name,
      p_owner_account_id: row.owner_account_id,
      p_phone: row.phone,
      p_website: row.website,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async save(business: Business): Promise<void> {
    const { error } = await this.client
      .from('businesses')
      .upsert(mapToRow(business));

    if (error) {
      throw new Error(error.message);
    }
  }
}

type ProvisionOwnerBusinessArgs = {
  p_address_city: string | null;
  p_address_country_code: string | null;
  p_address_line1: string | null;
  p_address_line2: string | null;
  p_address_postal_code: string | null;
  p_address_region: string | null;
  p_business_id: string;
  p_country_code: string;
  p_currency_code: string;
  p_email: string | null;
  p_legal_name: string | null;
  p_logo_asset_id: string | null;
  p_name: string;
  p_owner_account_id: string;
  p_phone: string | null;
  p_website: string | null;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapRow(row: BusinessRow): Business {
  return {
    id: row.id,
    ownerAccountId: row.owner_account_id,
    name: row.name,
    legalName: row.legal_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    address:
      row.address_line1 || row.address_line2 || row.address_city
        ? {
            line1: row.address_line1 ?? undefined,
            line2: row.address_line2 ?? undefined,
            city: row.address_city ?? undefined,
            region: row.address_region ?? undefined,
            postalCode: row.address_postal_code ?? undefined,
            countryCode: row.address_country_code ?? undefined,
          }
        : undefined,
    countryCode: row.country_code,
    currencyCode: row.currency_code,
    logoAssetId: row.logo_asset_id ?? undefined,
    defaultInvoiceThemeId: row.default_invoice_theme_id ?? undefined,
    defaultQuoteThemeId: row.default_quote_theme_id ?? undefined,
  };
}

function mapToRow(business: Business): BusinessRow {
  return {
    id: business.id,
    owner_account_id: business.ownerAccountId,
    name: business.name,
    legal_name: business.legalName ?? null,
    email: business.email ?? null,
    phone: business.phone ?? null,
    website: business.website ?? null,
    address_line1: business.address?.line1 ?? null,
    address_line2: business.address?.line2 ?? null,
    address_city: business.address?.city ?? null,
    address_region: business.address?.region ?? null,
    address_postal_code: business.address?.postalCode ?? null,
    address_country_code: business.address?.countryCode ?? null,
    country_code: business.countryCode,
    currency_code: business.currencyCode,
    logo_asset_id: business.logoAssetId ?? null,
    default_invoice_theme_id: business.defaultInvoiceThemeId ?? null,
    default_quote_theme_id: business.defaultQuoteThemeId ?? null,
  };
}
