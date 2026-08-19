import { SupabaseClientRepository } from './supabase-client.repository';

type SupabaseClientRepositoryClient = ConstructorParameters<
  typeof SupabaseClientRepository
>[0];

type Builder = {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  in: jest.Mock;
  maybeSingle: jest.Mock;
  upsert: jest.Mock;
  then: (onFulfilled?: (value: unknown) => unknown) => Promise<unknown>;
};

function createBuilder(result: unknown): Builder {
  const builder: Builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    or: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    in: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    upsert: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return builder;
}

function createClient(
  results: Record<string, unknown>,
): SupabaseClientRepositoryClient {
  const from = jest.fn((table: string) => createBuilder(results[table]));
  return { from } as unknown as SupabaseClientRepositoryClient;
}

const clientRow = {
  id: 'c1',
  business_id: 'b1',
  name: 'Acme',
  company: null,
  phone: null,
  billing_address_line1: null,
  billing_address_line2: null,
  billing_address_city: null,
  billing_address_region: null,
  billing_address_postal_code: null,
  billing_address_country_code: null,
  tax_number: null,
  internal_note: null,
  archived_at: null,
};

describe('SupabaseClientRepository', () => {
  it('maps a client with its emails on findById', async () => {
    const client = createClient({
      clients: { data: clientRow, error: null },
      client_emails: {
        data: [
          { id: 'e1', client_id: 'c1', address: 'a@b.com', is_primary: true },
        ],
        error: null,
      },
    });
    const repository = new SupabaseClientRepository(client);

    const result = await repository.findById('c1', 'b1');

    expect(result).toEqual({
      id: 'c1',
      businessId: 'b1',
      name: 'Acme',
      emails: [{ id: 'e1', address: 'a@b.com', isPrimary: true }],
    });
  });

  it('returns null when findById finds nothing', async () => {
    const client = createClient({
      clients: { data: null, error: null },
      client_emails: { data: [], error: null },
    });
    const repository = new SupabaseClientRepository(client);

    await expect(repository.findById('missing', 'b1')).resolves.toBeNull();
  });

  it('lists clients with their emails', async () => {
    const client = createClient({
      clients: { data: [clientRow], error: null },
      client_emails: {
        data: [
          { id: 'e1', client_id: 'c1', address: 'a@b.com', is_primary: true },
        ],
        error: null,
      },
    });
    const repository = new SupabaseClientRepository(client);

    const page = await repository.list({ businessId: 'b1' });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].emails[0].address).toBe('a@b.com');
  });
});
