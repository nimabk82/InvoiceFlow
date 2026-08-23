import { SupabaseThemeRepository } from './supabase-theme.repository';

type SupabaseThemeRepositoryClient = ConstructorParameters<
  typeof SupabaseThemeRepository
>[0];

const themeRow = {
  id: 'theme-1',
  business_id: 'business-1',
  name: 'Clean',
  applies_to_invoice: true,
  applies_to_quote: false,
  current_version_id: 'version-1',
  archived_at: null,
  created_at: '2026-08-22T00:00:00.000Z',
  updated_at: '2026-08-22T00:00:00.000Z',
};

const versionRow = {
  id: 'version-2',
  theme_id: 'theme-1',
  version: 2,
  schema_version: 1,
  config: { page: { size: 'letter' } },
  created_at: '2026-08-22T00:01:00.000Z',
  created_by: null,
};

function createClient(results: Record<string, unknown>) {
  const rpc = jest.fn((name: string) => Promise.resolve(results[name]));
  return {
    client: { rpc } as unknown as SupabaseThemeRepositoryClient,
    rpc,
  };
}

describe('SupabaseThemeRepository atomic lifecycle writes', () => {
  it('creates a theme and initial version through one RPC', async () => {
    const { client, rpc } = createClient({
      create_theme_with_initial_version: { data: themeRow, error: null },
    });
    const repository = new SupabaseThemeRepository(client);

    const theme = await repository.createThemeWithInitialVersion({
      businessId: 'business-1',
      name: 'Clean',
      appliesToInvoice: true,
      appliesToQuote: false,
      schemaVersion: 1,
      config: { page: { size: 'letter' } },
    });

    expect(theme.currentVersionId).toBe('version-1');
    expect(rpc).toHaveBeenCalledWith('create_theme_with_initial_version', {
      p_business_id: 'business-1',
      p_name: 'Clean',
      p_applies_to_invoice: true,
      p_applies_to_quote: false,
      p_schema_version: 1,
      p_config: { page: { size: 'letter' } },
    });
  });

  it('delegates version assignment and current pointer update to one RPC', async () => {
    const { client, rpc } = createClient({
      append_theme_version: { data: versionRow, error: null },
    });
    const repository = new SupabaseThemeRepository(client);

    const version = await repository.appendVersion({
      themeId: 'theme-1',
      businessId: 'business-1',
      schemaVersion: 1,
      config: versionRow.config,
    });

    expect(version.version).toBe(2);
    expect(rpc).toHaveBeenCalledWith('append_theme_version', {
      p_theme_id: 'theme-1',
      p_business_id: 'business-1',
      p_schema_version: 1,
      p_config: versionRow.config,
    });
  });
});
