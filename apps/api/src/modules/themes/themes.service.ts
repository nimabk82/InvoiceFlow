import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { DocumentTheme, DocumentThemeVersion } from '@invoiceflow/domain';
import { themePresets, validateThemeConfig } from '@invoiceflow/theme-schema';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  THEME_REPOSITORY,
  type ThemeRepository,
} from './repositories/theme.repository';

export type CreateThemeFromPresetInput = {
  preset: string;
  name?: string;
  appliesToInvoice?: boolean;
  appliesToQuote?: boolean;
};

export type UpdateThemeInput = {
  name?: string;
  appliesToInvoice?: boolean;
  appliesToQuote?: boolean;
};

export type ThemeDetail = {
  theme: DocumentTheme;
  versions: DocumentThemeVersion[];
};

const THEME_SCHEMA_VERSION = 1;

@Injectable()
export class ThemesService {
  constructor(
    @Inject(THEME_REPOSITORY)
    private readonly themeRepository: ThemeRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
  ) {}

  private async assertBusiness(businessId: string): Promise<void> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
  }

  async list(
    businessId: string,
    includeArchived = false,
  ): Promise<DocumentTheme[]> {
    await this.assertBusiness(businessId);
    const themes = await this.themeRepository.listByBusiness(businessId);
    return includeArchived
      ? themes
      : themes.filter((theme) => !theme.archivedAt);
  }

  async get(businessId: string, themeId: string): Promise<ThemeDetail> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    const versions = await this.themeRepository.listVersions(themeId);
    return { theme, versions };
  }

  async getHistoricalVersion(
    businessId: string,
    themeId: string,
    versionId: string,
  ): Promise<DocumentThemeVersion> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    const version = await this.themeRepository.getVersion(versionId);
    if (!version || version.themeId !== themeId) {
      throw new NotFoundException('Theme version not found');
    }
    return version;
  }

  async getVersionState(
    businessId: string,
    themeId: string,
    frozenVersionId: string | undefined,
  ): Promise<{
    themeId: string;
    themeVersionId: string | undefined;
    newerVersionAvailable: boolean;
  }> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    return {
      themeId,
      themeVersionId: frozenVersionId,
      newerVersionAvailable:
        Boolean(frozenVersionId) &&
        theme.currentVersionId !== '' &&
        theme.currentVersionId !== frozenVersionId,
    };
  }

  async createFromPreset(
    businessId: string,
    input: CreateThemeFromPresetInput,
  ): Promise<DocumentTheme> {
    await this.assertBusiness(businessId);

    const preset = input.preset.trim();
    const presetName = preset as keyof typeof themePresets;
    if (!(presetName in themePresets)) {
      throw new BadRequestException(`Unknown theme preset: ${preset}`);
    }

    const name = input.name?.trim() || titleCase(preset);

    const theme: DocumentTheme = {
      id: randomUUID(),
      businessId,
      name,
      appliesToInvoice: input.appliesToInvoice ?? true,
      appliesToQuote: input.appliesToQuote ?? false,
      currentVersionId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.themeRepository.saveTheme(theme);

    const version = await this.createVersion(
      theme.id,
      themePresets[presetName],
    );
    theme.currentVersionId = version.id;

    await this.themeRepository.saveTheme(theme);

    return theme;
  }

  async duplicate(businessId: string, themeId: string): Promise<DocumentTheme> {
    const detail = await this.get(businessId, themeId);
    const latest = detail.versions[detail.versions.length - 1];
    if (!latest) {
      throw new BadRequestException('Theme has no versions to duplicate');
    }

    const copy: DocumentTheme = {
      id: randomUUID(),
      businessId,
      name: `${detail.theme.name} (copy)`,
      appliesToInvoice: detail.theme.appliesToInvoice,
      appliesToQuote: detail.theme.appliesToQuote,
      currentVersionId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.themeRepository.saveTheme(copy);

    const version = await this.createVersion(copy.id, latest.config);
    copy.currentVersionId = version.id;

    await this.themeRepository.saveTheme(copy);

    return copy;
  }

  async update(
    businessId: string,
    themeId: string,
    input: UpdateThemeInput,
  ): Promise<DocumentTheme> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const updated: DocumentTheme = {
      ...theme,
      name: input.name?.trim() || theme.name,
      appliesToInvoice: input.appliesToInvoice ?? theme.appliesToInvoice,
      appliesToQuote: input.appliesToQuote ?? theme.appliesToQuote,
      updatedAt: new Date().toISOString(),
    };

    await this.themeRepository.saveTheme(updated);

    return updated;
  }

  async setDefault(
    businessId: string,
    themeId: string,
    kind: 'invoice' | 'quote',
  ): Promise<DocumentTheme> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    if (theme.archivedAt) {
      throw new BadRequestException('Archived themes cannot be set as default');
    }

    const businessIdField =
      kind === 'invoice' ? 'defaultInvoiceThemeId' : 'defaultQuoteThemeId';

    const updatedBusiness = {
      ...business,
      [businessIdField]: themeId,
    };
    await this.businessRepository.save(updatedBusiness);

    const all = await this.themeRepository.listByBusiness(businessId);
    for (const other of all) {
      const isTarget = other.id === themeId;
      const changed =
        kind === 'invoice'
          ? other.appliesToInvoice !== isTarget
          : other.appliesToQuote !== isTarget;
      if (!changed) continue;

      const patch: DocumentTheme = {
        ...other,
        appliesToInvoice:
          kind === 'invoice' ? isTarget : other.appliesToInvoice,
        appliesToQuote: kind === 'quote' ? isTarget : other.appliesToQuote,
        updatedAt: new Date().toISOString(),
      };
      await this.themeRepository.saveTheme(patch);
    }

    const reloaded = await this.themeRepository.getTheme(themeId, businessId);
    return reloaded ?? theme;
  }

  async archive(businessId: string, themeId: string): Promise<DocumentTheme> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const updated: DocumentTheme = {
      ...theme,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.themeRepository.saveTheme(updated);

    return updated;
  }

  async restore(businessId: string, themeId: string): Promise<DocumentTheme> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const updated: DocumentTheme = {
      ...theme,
      archivedAt: undefined,
      updatedAt: new Date().toISOString(),
    };

    await this.themeRepository.saveTheme(updated);

    return updated;
  }

  async saveConfig(
    businessId: string,
    themeId: string,
    config: Record<string, unknown>,
  ): Promise<ThemeDetail> {
    const theme = await this.themeRepository.getTheme(themeId, businessId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const result = validateThemeConfig(config);
    if (!result.valid) {
      throw new BadRequestException(
        `Theme configuration is invalid: ${result.issues.map((issue) => issue.message).join('; ')}`,
      );
    }

    const version = await this.createVersion(themeId, config);
    const updated: DocumentTheme = {
      ...theme,
      currentVersionId: version.id,
      updatedAt: new Date().toISOString(),
    };

    await this.themeRepository.saveTheme(updated);

    return this.get(businessId, themeId);
  }

  private async createVersion(
    themeId: string,
    config: unknown,
  ): Promise<DocumentThemeVersion> {
    const versionNumber = await this.themeRepository.nextVersionNumber(themeId);
    const version: DocumentThemeVersion = {
      id: randomUUID(),
      themeId,
      version: versionNumber,
      schemaVersion: THEME_SCHEMA_VERSION,
      config: config as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    };

    await this.themeRepository.createVersion(version);

    return version;
  }
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
