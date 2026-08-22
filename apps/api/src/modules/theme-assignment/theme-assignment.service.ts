import { Inject, Injectable } from '@nestjs/common';
import type { DocumentTheme, DocumentThemeVersion } from '@invoiceflow/domain';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from '../themes/repositories/theme.repository';

export type ThemeAssignment = {
  themeId: string;
  themeVersionId: string;
  themeName: string;
};

@Injectable()
export class ThemeAssignmentService {
  constructor(
    @Inject(THEME_REPOSITORY)
    private readonly themeRepository: ThemeRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
  ) {}

  async resolveDefault(
    businessId: string,
    kind: 'invoice' | 'quote',
  ): Promise<ThemeAssignment | undefined> {
    const business = await this.businessRepository.findById(businessId);
    const defaultThemeId =
      kind === 'invoice'
        ? business?.defaultInvoiceThemeId
        : business?.defaultQuoteThemeId;

    if (!defaultThemeId) {
      return undefined;
    }

    const theme = await this.themeRepository.getTheme(
      defaultThemeId,
      businessId,
    );
    if (!theme || theme.archivedAt || !theme.currentVersionId) {
      return undefined;
    }

    const version = await this.themeRepository.getVersion(
      theme.currentVersionId,
    );
    if (!version) {
      return undefined;
    }

    return this.toAssignment(theme, version);
  }

  async resolveById(
    themeId: string | undefined,
    businessId: string,
  ): Promise<ThemeAssignment | undefined> {
    if (!themeId) {
      return undefined;
    }

    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme || !theme.currentVersionId) {
      return undefined;
    }

    const version = await this.themeRepository.getVersion(
      theme.currentVersionId,
    );
    if (!version) {
      return undefined;
    }

    return this.toAssignment(theme, version);
  }

  async resolveNewerVersion(
    businessId: string,
    themeId: string | undefined,
    frozenVersionId: string | undefined,
  ): Promise<{ newerVersionAvailable: boolean; latest?: ThemeAssignment }> {
    if (!themeId || !frozenVersionId) {
      return { newerVersionAvailable: false };
    }

    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme || theme.currentVersionId === frozenVersionId) {
      return { newerVersionAvailable: false };
    }

    const latest = await this.resolveById(themeId, businessId);
    return {
      newerVersionAvailable: Boolean(latest),
      latest,
    };
  }

  private toAssignment(
    theme: DocumentTheme,
    version: DocumentThemeVersion,
  ): ThemeAssignment {
    return {
      themeId: theme.id,
      themeVersionId: version.id,
      themeName: theme.name,
    };
  }
}
