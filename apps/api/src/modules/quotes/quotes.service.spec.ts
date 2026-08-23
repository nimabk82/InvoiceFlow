import type { BusinessRepository } from '../businesses/repositories/business.repository';
import type { ClientRepository } from '../clients/repositories/client.repository';
import type { EmailProvider } from '../email/email-provider';
import type { ActivityEventRepository } from '../audit/repositories/activity-event.repository';
import type { ThemeAssignmentService } from '../theme-assignment/theme-assignment.service';
import { QuotesService } from './quotes.service';
import type { QuoteRepository } from './repositories/quote.repository';

function createDeps() {
  const save = jest.fn().mockResolvedValue(undefined);
  const markSent = jest.fn().mockResolvedValue(true);
  const convertToInvoice = jest.fn().mockResolvedValue(true);
  const quoteRepository = {
    findById: jest.fn(),
    list: jest.fn().mockResolvedValue({ items: [] }),
    save,
    markSent,
    convertToInvoice,
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
  const themeAssignment = {
    resolveDefault: jest.fn().mockResolvedValue(undefined),
    resolveById: jest.fn().mockResolvedValue(undefined),
    resolveNewerVersion: jest.fn().mockResolvedValue({
      newerVersionAvailable: false,
    }),
  } as unknown as ThemeAssignmentService;

  return {
    quoteRepository,
    businessRepository,
    clientRepository,
    emailProvider,
    activityEventRepository,
    themeAssignment,
    save,
    emailSend,
    activityRecord,
    markSent,
    convertToInvoice,
  };
}

function buildService(deps: ReturnType<typeof createDeps>) {
  return new QuotesService(
    deps.quoteRepository,
    deps.businessRepository,
    deps.clientRepository,
    deps.emailProvider,
    deps.activityEventRepository,
    deps.themeAssignment,
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
      items: [
        {
          description: 'Consulting',
          quantity: '2',
          rate: '500',
          sourceProductServiceId: 'product-1',
        },
      ],
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
    expect(quote.items[0].sourceProductServiceId).toBe('product-1');
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

  it('rejects an explicit client outside the business on create and update', async () => {
    const deps = createDeps();
    const service = buildService(deps);
    (deps.businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
    });
    (deps.clientRepository.findById as jest.Mock).mockResolvedValue(null);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      status: 'draft',
      number: 'Q-1',
      clientSnapshot: { displayName: 'Old', emails: [] },
      businessSnapshot: { displayName: 'Acme' },
      currencyCode: 'CAD',
      issueDate: '2026-08-01',
      items: [],
    });
    const input = {
      clientId: 'foreign-client',
      issueDate: '2026-08-22',
      currencyCode: 'CAD',
      items: [],
    };

    await expect(service.createQuote('business-1', input)).rejects.toThrow(
      'Client not found for this business',
    );
    await expect(
      service.updateQuote('business-1', 'quote-1', input),
    ).rejects.toThrow('Client not found for this business');
    expect(deps.save).not.toHaveBeenCalled();
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
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
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
    expect(deps.markSent).toHaveBeenCalledWith(
      'quote-1',
      'business-1',
      sent.sentAt,
    );
    expect(activityRecord).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'quote', type: 'sent' }),
    );
  });

  it('does not email when the draft-to-sent compare-and-set loses', async () => {
    const deps = createDeps();
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      number: 'Q-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
      convertedInvoiceIds: [],
    });
    deps.markSent.mockResolvedValue(false);

    await expect(
      service.sendQuote('business-1', 'quote-1', {
        to: ['client@example.com'],
        subject: 'Quote',
      }),
    ).rejects.toThrow('Only draft quotes can be sent');
    expect(deps.emailSend).not.toHaveBeenCalled();
  });

  it('rejects invalid quote content and recipients before email delivery', async () => {
    const deps = createDeps();
    const service = buildService(deps);
    (deps.quoteRepository.findById as jest.Mock).mockResolvedValue({
      id: 'quote-1',
      businessId: 'business-1',
      number: 'Q-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: ' ', quantity: '0', rate: '-1' }],
      convertedInvoiceIds: [],
    });

    await expect(
      service.sendQuote('business-1', 'quote-1', {
        to: ['invalid'],
        subject: 'Quote',
      }),
    ).rejects.toThrow('Enter an item description');
    expect(deps.emailSend).not.toHaveBeenCalled();
    expect(deps.save).not.toHaveBeenCalled();
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
    const { activityRecord } = deps;
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
      themeId: 'theme-1',
      themeVersionId: 'tv-1',
      themeNameSnapshot: 'Clean',
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
      updatedAt: '2026-08-22T00:00:00.000Z',
    });

    const { quote, invoice } = await service.convertQuote(
      'business-1',
      'quote-1',
    );

    expect(invoice.status).toBe('draft');
    expect(invoice.sourceQuoteId).toBe('quote-1');
    expect(invoice.themeId).toBe('theme-1');
    expect(invoice.themeVersionId).toBe('tv-1');
    expect(invoice.themeNameSnapshot).toBe('Clean');
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
    expect(deps.convertToInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'quote-1' }),
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
