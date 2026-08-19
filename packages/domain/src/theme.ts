export type DocumentThemeConfig = Record<string, unknown>;

export type DocumentTheme = {
  id: string;
  businessId: string;
  name: string;
  appliesToInvoice: boolean;
  appliesToQuote: boolean;
  currentVersionId: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentThemeVersion = {
  id: string;
  themeId: string;
  version: number;
  schemaVersion: number;
  config: DocumentThemeConfig;
  createdAt: string;
  createdBy?: string;
};