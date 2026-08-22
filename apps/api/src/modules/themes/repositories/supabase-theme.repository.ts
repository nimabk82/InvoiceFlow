import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentTheme, DocumentThemeVersion } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { ThemeRepository } from './theme.repository';

type ThemeRow = {
  id: string;
  business_id: string;
  name: string;
  applies_to_invoice: boolean;
  applies_to_quote: boolean;
  current_version_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type ThemeVersionRow = {
  id: string;
  theme_id: string;
  version: number;
  schema_version: number;
  config: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
};

type Database = {
  public: {
    Tables: {
      themes: {
        Row: ThemeRow;
        Insert: ThemeRow;
        Update: Partial<ThemeRow>;
        Relationships: [];
      };
      theme_versions: {
        Row: ThemeVersionRow;
        Insert: ThemeVersionRow;
        Update: Partial<ThemeVersionRow>;
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
export class SupabaseThemeRepository implements ThemeRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async getTheme(
    id: string,
    businessId: string,
  ): Promise<DocumentTheme | null> {
    const { data, error } = await this.client
      .from('themes')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapThemeRow(data) : null;
  }

  async getVersion(id: string): Promise<DocumentThemeVersion | null> {
    const { data, error } = await this.client
      .from('theme_versions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapVersionRow(data) : null;
  }

  async listByBusiness(businessId: string): Promise<DocumentTheme[]> {
    const { data, error } = await this.client
      .from('themes')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapThemeRow);
  }

  async listVersions(themeId: string): Promise<DocumentThemeVersion[]> {
    const { data, error } = await this.client
      .from('theme_versions')
      .select('*')
      .eq('theme_id', themeId)
      .order('version', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapVersionRow);
  }

  async saveTheme(theme: DocumentTheme): Promise<void> {
    const { error } = await this.client
      .from('themes')
      .upsert(mapThemeToRow(theme));

    if (error) {
      throw new Error(error.message);
    }
  }

  async createVersion(version: DocumentThemeVersion): Promise<void> {
    const { error } = await this.client
      .from('theme_versions')
      .upsert(mapVersionToRow(version));

    if (error) {
      throw new Error(error.message);
    }
  }

  async nextVersionNumber(themeId: string): Promise<number> {
    const versions = await this.listVersions(themeId);
    return versions.length === 0
      ? 1
      : versions[versions.length - 1].version + 1;
  }
}

function mapThemeRow(row: ThemeRow): DocumentTheme {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    appliesToInvoice: row.applies_to_invoice,
    appliesToQuote: row.applies_to_quote,
    currentVersionId: row.current_version_id ?? '',
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapThemeToRow(theme: DocumentTheme): ThemeRow {
  return {
    id: theme.id,
    business_id: theme.businessId,
    name: theme.name,
    applies_to_invoice: theme.appliesToInvoice,
    applies_to_quote: theme.appliesToQuote,
    current_version_id: theme.currentVersionId || null,
    archived_at: theme.archivedAt ?? null,
    created_at: theme.createdAt,
    updated_at: theme.updatedAt,
  };
}

function mapVersionRow(row: ThemeVersionRow): DocumentThemeVersion {
  return {
    id: row.id,
    themeId: row.theme_id,
    version: row.version,
    schemaVersion: row.schema_version,
    config: row.config,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
  };
}

function mapVersionToRow(version: DocumentThemeVersion): ThemeVersionRow {
  return {
    id: version.id,
    theme_id: version.themeId,
    version: version.version,
    schema_version: version.schemaVersion,
    config: version.config,
    created_at: version.createdAt,
    created_by: version.createdBy ?? null,
  };
}
