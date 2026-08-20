import { SupabaseBusinessRepository } from './supabase-business.repository';

type SupabaseBusinessClient = ConstructorParameters<
  typeof SupabaseBusinessRepository
>[0];

type Builder = {
  select: jest.Mock;
  eq: jest.Mock;
  maybeSingle: jest.Mock;
  insert: jest.Mock;
  upsert: jest.Mock;
  then: (onFulfilled?: (value: unknown) => unknown) => Promise<unknown>;
};

function createBuilder(result: unknown): Builder {
  const builder: Builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    insert: jest.fn(() => Promise.resolve(result)),
    upsert: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return builder;
}

function createClient(
  results: Record<string, unknown>,
): SupabaseBusinessClient {
  const from = jest.fn((table: string) => createBuilder(results[table]));
  return { from } as unknown as SupabaseBusinessClient;
}

const businessId = '00000000-0000-0000-0000-000000000001';
const accountId = '00000000-0000-0000-0000-000000000002';

const businessRow = {
  id: businessId,
  owner_account_id: 'account-1',
  name: 'Acme',
  legal_name: 'Acme Inc.',
  email: null,
  phone: null,
  website: null,
  address_line1: null,
  address_line2: null,
  address_city: null,
  address_region: null,
  address_postal_code: null,
  address_country_code: null,
  country_code: 'CA',
  currency_code: 'CAD',
  logo_asset_id: null,
  default_invoice_theme_id: null,
  default_quote_theme_id: null,
};

describe('SupabaseBusinessRepository', () => {
  it('maps a row to a Business on findById', async () => {
    const client = createClient({
      businesses: { data: businessRow, error: null },
    });
    const repository = new SupabaseBusinessRepository(client);

    await expect(repository.findById(businessId)).resolves.toEqual({
      id: businessId,
      ownerAccountId: 'account-1',
      name: 'Acme',
      legalName: 'Acme Inc.',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
  });

  it('returns null when findById finds nothing', async () => {
    const client = createClient({
      businesses: { data: null, error: null },
    });
    const repository = new SupabaseBusinessRepository(client);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('maps rows on listByOwner', async () => {
    const client = createClient({
      businesses: { data: [businessRow], error: null },
    });
    const repository = new SupabaseBusinessRepository(client);

    const businesses = await repository.listByOwner('account-1');
    expect(businesses).toHaveLength(1);
    expect(businesses[0].name).toBe('Acme');
  });

  it('resolves isMember from the membership table', async () => {
    const memberClient = createClient({
      business_members: {
        data: { account_id: accountId, business_id: businessId, role: 'owner' },
        error: null,
      },
    });
    const nonMemberClient = createClient({
      business_members: { data: null, error: null },
    });

    await expect(
      new SupabaseBusinessRepository(memberClient).isMember(
        accountId,
        businessId,
      ),
    ).resolves.toBe(true);
    await expect(
      new SupabaseBusinessRepository(nonMemberClient).isMember(
        accountId,
        businessId,
      ),
    ).resolves.toBe(false);
  });

  it('returns false for a non-UUID business id without querying', async () => {
    const client = createClient({
      business_members: { data: null, error: null },
    });
    const repository = new SupabaseBusinessRepository(client);

    await expect(
      repository.isMember(accountId, 'sample-business'),
    ).resolves.toBe(false);
    await expect(repository.isMember('not-a-uuid', businessId)).resolves.toBe(
      false,
    );
  });

  it('inserts a member on addMember', async () => {
    const client = createClient({ business_members: { error: null } });
    const repository = new SupabaseBusinessRepository(client);

    await expect(
      repository.addMember('account-1', 'b1', 'owner'),
    ).resolves.toBeUndefined();
  });

  it('upserts a business on save', async () => {
    const client = createClient({ businesses: { error: null } });
    const repository = new SupabaseBusinessRepository(client);

    await expect(
      repository.save({
        id: 'b1',
        ownerAccountId: 'account-1',
        name: 'Acme',
        countryCode: 'CA',
        currencyCode: 'CAD',
      }),
    ).resolves.toBeUndefined();
  });
});
