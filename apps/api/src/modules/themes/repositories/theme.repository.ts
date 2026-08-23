import type { DocumentTheme, DocumentThemeVersion } from '@invoiceflow/domain';

export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');

export type CreateThemeWithInitialVersionInput = {
  businessId: string;
  name: string;
  appliesToInvoice: boolean;
  appliesToQuote: boolean;
  schemaVersion: number;
  config: Record<string, unknown>;
};

export type AppendThemeVersionInput = {
  themeId: string;
  businessId: string;
  schemaVersion: number;
  config: Record<string, unknown>;
};

export interface ThemeRepository {
  getTheme(id: string, businessId: string): Promise<DocumentTheme | null>;
  getVersion(id: string): Promise<DocumentThemeVersion | null>;
  listByBusiness(businessId: string): Promise<DocumentTheme[]>;
  listVersions(themeId: string): Promise<DocumentThemeVersion[]>;
  saveTheme(theme: DocumentTheme): Promise<void>;
  createThemeWithInitialVersion(
    input: CreateThemeWithInitialVersionInput,
  ): Promise<DocumentTheme>;
  appendVersion(input: AppendThemeVersionInput): Promise<DocumentThemeVersion>;
}
