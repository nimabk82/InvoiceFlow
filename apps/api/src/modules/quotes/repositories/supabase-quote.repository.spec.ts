import type { Invoice, Quote } from '@invoiceflow/domain';

import { SupabaseQuoteRepository } from './supabase-quote.repository';

type RepositoryClient = ConstructorParameters<
  typeof SupabaseQuoteRepository
>[0];

function createClient(results: Record<string, unknown>): RepositoryClient {
  return {
    rpc: jest.fn((name: string) => Promise.resolve(results[name])),
  } as unknown as RepositoryClient;
}

const quote: Quote = {
  id: 'quote-1',
  businessId: 'business-1',
  number: 'Q-1',
  clientSnapshot: { displayName: 'Client', emails: [] },
  businessSnapshot: { displayName: 'Acme', taxNumbers: [] },
  currencyCode: 'CAD',
  issueDate: '2026-08-22',
  items: [
    {
      id: 'quote-item-1',
      description: 'Work',
      quantity: '1',
      rate: '100',
      appliedTaxes: [{ name: 'GST', rate: '5' }],
    },
  ],
  status: 'accepted',
  convertedInvoiceIds: [],
  createdAt: '2026-08-22T00:00:00.000Z',
  updatedAt: '2026-08-22T00:00:00.000Z',
};

const invoice: Invoice = {
  id: 'invoice-1',
  businessId: 'business-1',
  number: 'INV-1',
  clientSnapshot: quote.clientSnapshot,
  businessSnapshot: quote.businessSnapshot,
  currencyCode: 'CAD',
  issueDate: '2026-08-22',
  items: [
    {
      id: 'invoice-item-1',
      description: 'Work',
      quantity: '1',
      rate: '100',
      appliedTaxes: [{ name: 'GST', rate: '5' }],
    },
  ],
  status: 'draft',
  sourceQuoteId: quote.id,
  createdAt: '2026-08-22T01:00:00.000Z',
  updatedAt: '2026-08-22T01:00:00.000Z',
};

describe('SupabaseQuoteRepository', () => {
  it('saves a quote aggregate through one RPC', async () => {
    const client = createClient({ save_quote_aggregate: { error: null } });
    const repository = new SupabaseQuoteRepository(client);

    await repository.save(quote);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.rpc).toHaveBeenCalledWith(
      'save_quote_aggregate',
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        p_quote: expect.objectContaining({ id: quote.id }),
        p_items: [
          expect.objectContaining({
            id: 'quote-item-1',
            taxes: [expect.objectContaining({ name: 'GST' })],
          }),
        ],
      }),
    );
  });

  it('persists quote conversion through one CAS RPC', async () => {
    const client = createClient({
      convert_quote_to_invoice: { data: true, error: null },
    });
    const repository = new SupabaseQuoteRepository(client);

    await expect(repository.convertToInvoice(quote, invoice)).resolves.toBe(
      true,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.rpc).toHaveBeenCalledWith(
      'convert_quote_to_invoice',
      expect.objectContaining({
        p_quote_id: quote.id,
        p_expected_updated_at: quote.updatedAt,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        p_invoice: expect.objectContaining({ source_quote_id: quote.id }),
      }),
    );
  });

  it('returns a failed send compare-and-set without hiding it', async () => {
    const client = createClient({
      send_quote_if_draft: { data: false, error: null },
    });
    const repository = new SupabaseQuoteRepository(client);

    await expect(
      repository.markSent(
        quote.id,
        quote.businessId,
        '2026-08-22T02:00:00.000Z',
      ),
    ).resolves.toBe(false);
  });
});
