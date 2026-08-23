import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentTheme, DocumentThemeVersion } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type {
  AppendThemeVersionInput,
  CreateThemeWithInitialVersionInput,
  ThemeRepository,
} from './theme.repository';

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
    Functions: {
      create_theme_with_initial_version: {
        Args: {
          p_business_id: string;
          p_name: string;
          p_applies_to_invoice: boolean;
          p_applies_to_quote: boolean;
          p_schema_version: number;
          p_config: Record<string, unknown>;
        };
        Returns: ThemeRow;
      };
      append_theme_version: {
        Args: {
          p_theme_id: string;
          p_business_id: string;
          p_schema_version: number;
          p_config: Record<string, unknown>;
        };
        Returns: ThemeVersionRow;
      };
    };
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

  async createThemeWithInitialVersion(
    input: CreateThemeWithInitialVersionInput,
  ): Promise<DocumentTheme> {
    const { data, error } = await this.client.rpc(
      'create_theme_with_initial_version',
      {
        p_business_id: input.businessId,
        p_name: input.name,
        p_applies_to_invoice: input.appliesToInvoice,
        p_applies_to_quote: input.appliesToQuote,
        p_schema_version: input.schemaVersion,
        p_config: input.config,
      },
    );

    if (error || !data) {
      throw new Error(error?.message ?? 'Theme creation returned no data');
    }

    return mapThemeRow(data);
  }

  async appendVersion(
    input: AppendThemeVersionInput,
  ): Promise<DocumentThemeVersion> {
    const { data, error } = await this.client.rpc('append_theme_version', {
      p_theme_id: input.themeId,
      p_business_id: input.businessId,
      p_schema_version: input.schemaVersion,
      p_config: input.config,
    });

    if (error || !data) {
      throw new Error(
        error?.message ?? 'Theme version append returned no data',
      );
    }

    return mapVersionRow(data);
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
