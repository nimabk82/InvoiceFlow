import { SupabaseInvoiceRepository } from './supabase-invoice.repository';

type SupabaseInvoiceRepositoryClient = ConstructorParameters<
  typeof SupabaseInvoiceRepository
>[0];

type Builder = {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
  upsert: jest.Mock;
  then: (onFulfilled?: (value: unknown) => unknown) => Promise<unknown>;
};

function createBuilder(result: unknown): Builder {
  const builder: Builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    upsert: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };
  return builder;
}

function createClient(
  results: Record<string, unknown>,
): SupabaseInvoiceRepositoryClient {
  const from = jest.fn((table: string) => createBuilder(results[table]));
  return { from } as unknown as SupabaseInvoiceRepositoryClient;
}

const clientSnapshot = {
  displayName: 'Client Co',
  emails: ['client@example.com'],
};

const businessSnapshot = {
  displayName: 'Acme Inc',
  emails: [],
  taxNumbers: [],
};

const invoiceRow = {
  id: 'inv1',
  business_id: 'b1',
  number: 'INV-001',
  client_id: null,
  client_snapshot: clientSnapshot,
  business_snapshot: businessSnapshot,
  currency_code: 'CAD',
  issue_date: '2026-08-01',
  due_date: '2026-08-31',
  discount: null,
  deposit_terms: null,
  notes: null,
  terms: null,
  po_number: null,
  status: 'draft',
  source_quote_id: null,
  theme_id: null,
  theme_version_id: null,
  theme_name_snapshot: null,
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
  sent_at: null,
};

const itemRow = {
  id: 'i1',
  document_type: 'invoice',
  document_id: 'inv1',
  source_product_service_id: null,
  description: 'Consulting',
  secondary_description: null,
  quantity: '1',
  rate: '5000',
  sort_order: 0,
};

describe('SupabaseInvoiceRepository', () => {
  it('maps an invoice with items and taxes on list', async () => {
    const client = createClient({
      invoices: { data: [invoiceRow], error: null },
      document_items: { data: [itemRow], error: null },
      document_item_taxes: {
        data: [
          { id: 't1', item_id: 'i1', tax_id: null, name: 'GST', rate: '13' },
        ],
        error: null,
      },
    });
    const repository = new SupabaseInvoiceRepository(client);

    const page = await repository.list({ businessId: 'b1' });

    expect(page.items).toHaveLength(1);
    const invoice = page.items[0];
    expect(invoice.number).toBe('INV-001');
    expect(invoice.clientSnapshot.displayName).toBe('Client Co');
    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0].quantity).toBe('1');
    expect(invoice.items[0].rate).toBe('5000');
    expect(invoice.items[0].appliedTaxes).toEqual([
      { name: 'GST', rate: '13' },
    ]);
  });
});
