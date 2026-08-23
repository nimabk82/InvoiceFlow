import type { ThemeConfig } from '@invoiceflow/theme-schema';
import type { BusinessRepository } from '../businesses/repositories/business.repository';
import { ThemesService } from './themes.service';
import type { ThemeRepository } from './repositories/theme.repository';

jest.mock('@invoiceflow/theme-schema', () => {
  const cleanConfig: ThemeConfig = {
    page: {
      size: 'letter',
      margin: 'standard',
      backgroundColor: '#ffffff',
      border: 'none',
    },
    brand: {
      logoSize: 'medium',
      primaryColor: '#2563eb',
      secondaryColor: '#dbeafe',
    },
    typography: { font: 'Inter', headingScale: 'comfortable' },
    header: { layout: 'classic' },
    billTo: { style: 'soft' },
    items: {
      headerStyle: 'line',
      rowStyle: 'plain',
      showQuantity: true,
      showRate: true,
      showTax: true,
    },
    totals: { layout: 'right', emphasis: 'bold' },
    deposit: { style: 'highlight' },
    footer: {
      alignment: 'center',
      showBusinessName: true,
      showWebsite: true,
      showPageNumber: true,
      customText: undefined,
      showDivider: true,
    },
    sections: [
      { id: 'header', enabled: true },
      { id: 'business', enabled: true },
      { id: 'document-info', enabled: true },
      { id: 'bill-to', enabled: true },
      { id: 'items', enabled: true },
      { id: 'totals', enabled: true },
      { id: 'deposit', enabled: true },
      { id: 'payment', enabled: true },
      { id: 'notes', enabled: true },
      { id: 'terms', enabled: true },
      { id: 'footer', enabled: true },
    ],
  };

  return {
    themePresets: { clean: cleanConfig },
    validateThemeConfig: (config: unknown) => {
      const record = (
        typeof config === 'object' && config !== null ? config : {}
      ) as Record<string, unknown>;
      const page = (
        typeof record.page === 'object' && record.page !== null
          ? record.page
          : {}
      ) as Record<string, unknown>;
      const sizes = ['letter', 'a4'];
      const margins = ['compact', 'standard', 'spacious'];
      const borders = ['none', 'thin', 'accent'];
      const issues: { code: string; message: string; path: string }[] = [];
      const stringValue = (value: unknown): string =>
        typeof value === 'string' ? value : '';
      if (!sizes.includes(stringValue(page.size))) {
        issues.push({
          code: 'invalid_value',
          message: 'Invalid value for page.size.',
          path: 'page.size',
        });
      }
      if (!margins.includes(stringValue(page.margin))) {
        issues.push({
          code: 'invalid_value',
          message: 'Invalid value for page.margin.',
          path: 'page.margin',
        });
      }
      if (!borders.includes(stringValue(page.border))) {
        issues.push({
          code: 'invalid_value',
          message: 'Invalid value for page.border.',
          path: 'page.border',
        });
      }
      return { valid: issues.length === 0, issues };
    },
  };
});

function createDeps() {
  const saveTheme = jest.fn().mockResolvedValue(undefined);
  const createThemeWithInitialVersion = jest
    .fn()
    .mockImplementation(
      (input: {
        businessId: string;
        name: string;
        appliesToInvoice: boolean;
        appliesToQuote: boolean;
      }) =>
        Promise.resolve({
          id: 'new-theme',
          businessId: input.businessId,
          name: input.name,
          appliesToInvoice: input.appliesToInvoice,
          appliesToQuote: input.appliesToQuote,
          currentVersionId: 'new-version',
          createdAt: '2026-08-22T00:00:00.000Z',
          updatedAt: '2026-08-22T00:00:00.000Z',
        }),
    );
  const appendVersion = jest.fn().mockResolvedValue({
    id: 'v2',
    themeId: 'theme-1',
    version: 2,
    schemaVersion: 1,
    config: {},
    createdAt: '2026-08-22T00:00:00.000Z',
  });
  const businessSave = jest.fn().mockResolvedValue(undefined);
  const themeRepository = {
    getTheme: jest.fn(),
    getVersion: jest.fn(),
    listByBusiness: jest.fn().mockResolvedValue([]),
    listVersions: jest.fn().mockResolvedValue([]),
    saveTheme,
    createThemeWithInitialVersion,
    appendVersion,
  } as unknown as ThemeRepository;
  const businessRepository = {
    findById: jest.fn().mockResolvedValue({ id: 'business-1', name: 'Acme' }),
    save: businessSave,
  } as unknown as BusinessRepository;
  return {
    themeRepository,
    businessRepository,
    saveTheme,
    createThemeWithInitialVersion,
    appendVersion,
    businessSave,
  };
}

function buildService(deps: ReturnType<typeof createDeps>) {
  return new ThemesService(deps.themeRepository, deps.businessRepository);
}

const baseTheme = {
  id: 'theme-1',
  businessId: 'business-1',
  name: 'Clean',
  appliesToInvoice: true,
  appliesToQuote: false,
  currentVersionId: 'v1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ThemesService', () => {
  it('creates a theme from a preset with its initial version atomically', async () => {
    const deps = createDeps();
    const service = buildService(deps);
    const { saveTheme, createThemeWithInitialVersion } = deps;

    const theme = await service.createFromPreset('business-1', {
      preset: 'clean',
    });

    expect(theme.businessId).toBe('business-1');
    expect(theme.name).toBe('Clean');
    expect(theme.appliesToInvoice).toBe(true);
    expect(theme.currentVersionId).not.toBe('');
    expect(createThemeWithInitialVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        name: 'Clean',
        schemaVersion: 1,
      }),
    );
    expect(saveTheme).not.toHaveBeenCalled();
  });

  it('rejects an unknown preset', async () => {
    const deps = createDeps();
    const service = buildService(deps);

    await expect(
      service.createFromPreset('business-1', { preset: 'not-a-preset' }),
    ).rejects.toThrow();
  });

  it('duplicates a theme copying the latest version config', async () => {
    const deps = createDeps();
    const { createThemeWithInitialVersion, saveTheme } = deps;
    (deps.themeRepository.getTheme as jest.Mock).mockResolvedValue(baseTheme);
    (deps.themeRepository.listVersions as jest.Mock).mockResolvedValue([
      {
        id: 'v1',
        themeId: 'theme-1',
        version: 1,
        schemaVersion: 1,
        config: { page: { size: 'letter' } },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    const service = buildService(deps);

    const copy = await service.duplicate('business-1', 'theme-1');

    expect(copy.name).toBe('Clean (copy)');
    expect(createThemeWithInitialVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'business-1',
        name: 'Clean (copy)',
        config: { page: { size: 'letter' } },
        schemaVersion: 1,
      }),
    );
    expect(saveTheme).not.toHaveBeenCalled();
  });

  it('archives and restores a theme', async () => {
    const deps = createDeps();
    (deps.themeRepository.getTheme as jest.Mock).mockResolvedValue(baseTheme);
    const service = buildService(deps);

    const archived = await service.archive('business-1', 'theme-1');
    expect(archived.archivedAt).toBeDefined();

    const restored = await service.restore('business-1', 'theme-1');
    expect(restored.archivedAt).toBeUndefined();
  });

  it('saves a new immutable version when the config changes', async () => {
    const deps = createDeps();
    const { appendVersion, saveTheme } = deps;
    (deps.themeRepository.getTheme as jest.Mock).mockResolvedValue(baseTheme);
    (deps.themeRepository.listVersions as jest.Mock).mockResolvedValue([]);
    const service = buildService(deps);

    const config: ThemeConfig = {
      page: {
        size: 'letter',
        margin: 'standard',
        backgroundColor: '#ffffff',
        border: 'none',
      },
      brand: { primaryColor: '#ff0000' },
      typography: { font: 'Inter', headingScale: 'comfortable' },
      header: { layout: 'classic' },
      billTo: { style: 'soft' },
      items: {
        headerStyle: 'line',
        rowStyle: 'plain',
        showQuantity: true,
        showRate: true,
        showTax: true,
      },
      totals: { layout: 'right', emphasis: 'bold' },
      deposit: { style: 'highlight' },
      footer: {
        alignment: 'center',
        showBusinessName: true,
        showWebsite: true,
        showPageNumber: true,
        showDivider: true,
      },
      sections: [{ id: 'items', enabled: true }],
    };

    await service.saveConfig('business-1', 'theme-1', config);

    expect(appendVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        themeId: 'theme-1',
        businessId: 'business-1',
        schemaVersion: 1,
        config,
      }),
    );
    expect(saveTheme).not.toHaveBeenCalled();
  });

  it('rejects an invalid theme config', async () => {
    const deps = createDeps();
    (deps.themeRepository.getTheme as jest.Mock).mockResolvedValue(baseTheme);
    const service = buildService(deps);

    await expect(
      service.saveConfig('business-1', 'theme-1', {
        page: { size: 'not-a-size' },
      }),
    ).rejects.toThrow();
  });

  it('sets a theme as the business default for a document kind', async () => {
    const deps = createDeps();
    const { saveTheme, businessSave } = deps;
    (deps.themeRepository.getTheme as jest.Mock).mockResolvedValue(baseTheme);
    (deps.themeRepository.listByBusiness as jest.Mock).mockResolvedValue([
      baseTheme,
      { ...baseTheme, id: 'theme-2', appliesToQuote: true },
    ]);
    (deps.businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
    const service = buildService(deps);

    await service.setDefault('business-1', 'theme-1', 'quote');

    expect(businessSave).toHaveBeenCalledWith(
      expect.objectContaining({ defaultQuoteThemeId: 'theme-1' }),
    );
    expect(saveTheme).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'theme-2', appliesToQuote: false }),
    );
  });
});
