import type { BusinessRepository } from '../businesses/repositories/business.repository';
import type { ClientRepository } from '../clients/repositories/client.repository';
import type { EmailProvider } from '../email/email-provider';
import type { ActivityEventRepository } from '../audit/repositories/activity-event.repository';
import type { InvoiceRepository } from '../invoices/repositories/invoice.repository';
import { QuotesService } from './quotes.service';
import type { QuoteRepository } from './repositories/quote.repository';

function createDeps() {
  const save = jest.fn().mockResolvedValue(undefined);
  const quoteRepository = {
    findById: jest.fn(),
    list: jest.fn().mockResolvedValue({ items: [] }),
    save,
  } as unknown as QuoteRepository;
  const businessRepository = {
    findById: jest.fn(),
  } as unknown as BusinessRepository;
  const clientRepository = {
    findById: jest.fn(),
  } as unknown as ClientRepository;
  const emailSend = jest.fn().mockResolvedValue({ accepted: true });
  const emailProvider = { send: emailSend } as unknown as EmailProvider;
  const activityRecord = jest.fn().mockResolvedValue(undefined);
  const activityEventRepository = {
    record: activityRecord,
    list: jest.fn().mockResolvedValue({ items: [] }),
  } as unknown as ActivityEventRepository;
  const invoiceSave = jest.fn().mockResolvedValue(undefined);
  const invoiceRepository = {
    findById: jest.fn(),
    list: jest.fn(),
    save: invoiceSave,
    delete: jest.fn(),
  } as unknown as InvoiceRepository;

  return {
    quoteRepository,
    businessRepository,
    clientRepository,
    emailProvider,
    activityEventRepository,
    invoiceRepository,
    save,
    emailSend,
    activityRecord,
    invoiceSave,
  };
}

function buildService(deps: ReturnType<typeof createDeps>) {
  return new QuotesService(
    deps.quoteRepository,
    deps.businessRepository,
    deps.clientRepository,
    deps.emailProvider,
    deps.activityEventRepository,
    deps.invoiceRepository,
  );
}

describe('QuotesService', () => {
  it('creates a quote draft with snapshots and saves it', async () => {
    const deps = createDeps();
    const { save } = deps;
    const service = buildService(deps);
    (deps.businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
    (deps.clientRepository.findById as jest.Mock).mockResolvedValue({
      id: 'client-1',
      businessId: 'business-1',
      company: 'Client Co',
      emails: [{ id: 'e1', address: 'c@example.com', isPrimary: true }],
    });

    const quote = await service.createQuote('business-1', {
      clientId: 'client-1',
      issueDate: '2026-08-22',
      currencyCode: 'CAD',
      items: [{ description: 'Consulting', quantity: '2', rate: '500' }],
      proposedDepositTerms: {
        type: 'percentage',
        value: '30',
        dueRule: 'on_receipt',
      },
    });

    expect(quote.status).toBe('draft');
    expect(quote.businessSnapshot.displayName).toBe('Acme');
    expect(quote.clientSnapshot.displayName).toBe('Client Co');
    expect(quote.items).toHaveLength(1);
    expect(quote.proposedDepositTerms).toEqual({
      type: 'percentage',
      value: '30',
      dueRule: 'on_receipt',
    });
    expect(quote.convertedInvoiceIds).toEqual([]);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: quote.id }),
    );
  });

  it('rejects a quote without a required currency or issue date', async () => {
    const deps = createDeps();
    const service = buildService(deps);

    await expect(
      service.createQuote('business-1', {
        issueDate: '',
        currencyCode: 'CAD',
        items: [],
      }),
    ).rejects.toThrow();
  });

  it('sends a draft quote, emails recipients, transitions to sent, and records activity', async () => {
    const deps = createDeps();
    const { emailSend, activityRecord } = deps;
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      number: 'Q-1',
      status: 'draft',
      businessSnapshot: { displayName: 'Acme' },
      convertedInvoiceIds: [],
    });

    const sent = await service.sendQuote('business-1', 'quote-1', {
      to: ['a@example.com'],
      subject: 'Your quote',
    });

    expect(emailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['a@example.com'] }),
    );
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeDefined();
    expect(activityRecord).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'quote', type: 'sent' }),
    );
  });

  it('accepts a sent quote and records an accepted event', async () => {
    const deps = createDeps();
    const { activityRecord } = deps;
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      status: 'sent',
      convertedInvoiceIds: [],
    });

    const accepted = await service.acceptQuote('business-1', 'quote-1');

    expect(accepted.status).toBe('accepted');
    expect(activityRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'accepted' }),
    );
  });

  it('declines a sent quote and records a declined event', async () => {
    const deps = createDeps();
    const { activityRecord } = deps;
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      status: 'sent',
      convertedInvoiceIds: [],
    });

    const declined = await service.declineQuote('business-1', 'quote-1');

    expect(declined.status).toBe('declined');
    expect(activityRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'declined' }),
    );
  });

  it('rejects acceptance of a non-sent quote', async () => {
    const deps = createDeps();
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      status: 'draft',
      convertedInvoiceIds: [],
    });

    await expect(
      service.acceptQuote('business-1', 'quote-1'),
    ).rejects.toThrow();
  });

  it('converts an accepted quote into a draft invoice preserving the relationship', async () => {
    const deps = createDeps();
    const { invoiceSave, activityRecord } = deps;
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      clientId: 'client-1',
      clientSnapshot: { displayName: 'Client Co', emails: [] },
      businessSnapshot: { displayName: 'Acme' },
      currencyCode: 'CAD',
      issueDate: '2026-08-22',
      status: 'accepted',
      items: [
        {
          id: 'item-1',
          description: 'Work',
          quantity: '1',
          rate: '500',
          appliedTaxes: [],
        },
      ],
      proposedDepositTerms: {
        type: 'percentage',
        value: '30',
        dueRule: 'on_receipt',
      },
      convertedInvoiceIds: [],
    });

    const { quote, invoice } = await service.convertQuote(
      'business-1',
      'quote-1',
    );

    expect(invoice.status).toBe('draft');
    expect(invoice.sourceQuoteId).toBe('quote-1');
    expect(invoice.clientSnapshot).toEqual({
      displayName: 'Client Co',
      emails: [],
    });
    expect(invoice.depositTerms).toEqual({
      type: 'percentage',
      value: '30',
      dueRule: 'on_receipt',
    });
    expect(quote.convertedInvoiceIds).toContain(invoice.id);
    expect(invoiceSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: invoice.id }),
    );
    expect(activityRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'converted' }),
    );
  });

  it('rejects converting a quote that is not accepted', async () => {
    const deps = createDeps();
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      status: 'sent',
      convertedInvoiceIds: [],
    });

    await expect(
      service.convertQuote('business-1', 'quote-1'),
    ).rejects.toThrow();
  });
});
