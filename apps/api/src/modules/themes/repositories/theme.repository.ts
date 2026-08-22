import type { DocumentTheme, DocumentThemeVersion } from '@invoiceflow/domain';

export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');

export interface ThemeRepository {
  getTheme(id: string, businessId: string): Promise<DocumentTheme | null>;
  getVersion(id: string): Promise<DocumentThemeVersion | null>;
  listByBusiness(businessId: string): Promise<DocumentTheme[]>;
  listVersions(themeId: string): Promise<DocumentThemeVersion[]>;
  nextVersionNumber(themeId: string): Promise<number>;
  saveTheme(theme: DocumentTheme): Promise<void>;
  createVersion(version: DocumentThemeVersion): Promise<void>;
}
