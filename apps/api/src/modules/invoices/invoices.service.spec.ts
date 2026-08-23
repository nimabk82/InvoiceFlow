import type { BusinessRepository } from '../businesses/repositories/business.repository';
import type { ClientRepository } from '../clients/repositories/client.repository';
import { InvoicesService } from './invoices.service';
import type { InvoiceRepository } from './repositories/invoice.repository';
import type { ThemeAssignmentService } from '../theme-assignment/theme-assignment.service';
import { PaymentRecordingError } from '../payments/repositories/payment.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const save = jest.fn().mockResolvedValue(undefined);
  const markSent = jest.fn().mockResolvedValue('outbox-1');
  const invoiceRepository = {
    findById: jest.fn(),
    list,
    save,
    markSentAndEnqueue: markSent,
  } as unknown as InvoiceRepository;
  const businessRepository = {
    findById: jest.fn(),
  } as unknown as BusinessRepository;
  const clientRepository = {
    findById: jest.fn(),
  } as unknown as ClientRepository;
  const emailProvider = {
    assertAvailable: jest.fn(),
    dispatch: jest.fn().mockResolvedValue(true),
  };
  const paymentRepository = {
    findById: jest.fn(),
    listByInvoice: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
    recordAtomically: jest.fn().mockResolvedValue({
      status: 'partially_paid',
      updatedAt: '2026-08-22T00:00:00.000Z',
    }),
  };
  const activityEventRepository = {
    record: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue({ items: [] }),
  };
  const themeAssignment = {
    resolveDefault: jest.fn().mockResolvedValue(undefined),
    resolveById: jest.fn().mockResolvedValue(undefined),
    resolveNewerVersion: jest.fn().mockResolvedValue({
      newerVersionAvailable: false,
    }),
  } as unknown as ThemeAssignmentService;

  return {
    invoiceRepository,
    businessRepository,
    clientRepository,
    emailProvider,
    paymentRepository,
    activityEventRepository,
    themeAssignment,
    list,
    save,
    markSent,
  };
}

function buildService(deps: ReturnType<typeof createRepository>) {
  return new InvoicesService(
    deps.invoiceRepository,
    deps.businessRepository,
    deps.clientRepository,
    deps.emailProvider,
    deps.paymentRepository,
    deps.activityEventRepository,
    deps.themeAssignment,
  );
}

describe('InvoicesService', () => {
  it('lists invoices for a business with an optional status', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      list,
    } = createRepository();
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    await service.list('business-1', { status: 'draft' });

    expect(list).toHaveBeenCalledWith({
      businessId: 'business-1',
      status: 'draft',
    });
  });

  it('creates an invoice draft with snapshots and saves it', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
    (clientRepository.findById as jest.Mock).mockResolvedValue({
      id: 'client-1',
      businessId: 'business-1',
      name: 'Client Co',
      emails: [{ id: 'e1', address: 'c@example.com', isPrimary: true }],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const invoice = await service.createInvoice('business-1', {
      clientId: 'client-1',
      issueDate: '2026-08-01',
      currencyCode: 'CAD',
      items: [
        {
          description: 'Consulting',
          quantity: '1',
          rate: '5000',
          sourceProductServiceId: 'product-1',
        },
      ],
    });

    expect(invoice.status).toBe('draft');
    expect(invoice.businessSnapshot.displayName).toBe('Acme');
    expect(invoice.clientSnapshot.displayName).toBe('Client Co');
    expect(invoice.items[0].sourceProductServiceId).toBe('product-1');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: invoice.id }),
    );
  });

  it('updates a draft invoice with refreshed snapshots', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'draft',
      number: 'INV-001',
      clientSnapshot: { displayName: 'Old', emails: [] },
      businessSnapshot: { displayName: 'Acme' },
      currencyCode: 'CAD',
      issueDate: '2026-08-01',
      items: [],
    });
    (businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
    (clientRepository.findById as jest.Mock).mockResolvedValue({
      id: 'client-2',
      businessId: 'business-1',
      name: 'New Client',
      emails: [{ id: 'e1', address: 'new@example.com', isPrimary: true }],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const updated = await service.updateInvoice('business-1', 'invoice-1', {
      clientId: 'client-2',
      issueDate: '2026-08-02',
      currencyCode: 'CAD',
      items: [{ description: 'Work', quantity: '1', rate: '50' }],
    });

    expect(updated.clientSnapshot.displayName).toBe('New Client');
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].description).toBe('Work');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'invoice-1', clientId: 'client-2' }),
    );
  });

  it('rejects editing a sent invoice', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'sent',
      currencyCode: 'CAD',
      issueDate: '2026-08-01',
      items: [],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    await expect(
      service.updateInvoice('business-1', 'invoice-1', {
        issueDate: '2026-08-02',
        currencyCode: 'CAD',
        items: [],
      }),
    ).rejects.toThrow();
  });

  it('assigns the default invoice theme on create and freezes it on send', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      markSent,
    } = createRepository();
    (businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
    (themeAssignment.resolveDefault as jest.Mock).mockResolvedValue({
      themeId: 'theme-1',
      themeVersionId: 'tv-1',
      themeName: 'Clean',
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const invoice = await service.createInvoice('business-1', {
      issueDate: '2026-08-01',
      currencyCode: 'CAD',
      items: [{ description: 'A', quantity: '1', rate: '10' }],
    });

    expect(invoice.themeId).toBe('theme-1');
    expect(invoice.themeVersionId).toBe('tv-1');
    expect(invoice.themeNameSnapshot).toBe('Clean');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(themeAssignment.resolveDefault as jest.Mock).toHaveBeenCalledWith(
      'business-1',
      'invoice',
    );

    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      ...invoice,
      clientId: 'client-1',
    });
    const sent = await service.sendInvoice('business-1', invoice.id, {
      to: ['client@example.com'],
      subject: 'Invoice',
    });

    expect(sent.status).toBe('sent');
    expect(sent.themeVersionId).toBe('tv-1');
    expect(markSent).toHaveBeenCalledWith(
      invoice.id,
      'business-1',
      sent.sentAt,
      expect.objectContaining({
        to: ['client@example.com'],
        subject: 'Invoice',
      }),
    );
  });

  it('rejects when required fields are missing', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    } = createRepository();
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    await expect(
      service.createInvoice('business-1', {
        issueDate: '',
        currencyCode: 'CAD',
        items: [],
      }),
    ).rejects.toThrow();
  });

  it('rejects an explicit client outside the business on create and update', async () => {
    const deps = createRepository();
    const service = buildService(deps);
    (deps.businessRepository.findById as jest.Mock).mockResolvedValue({
      id: 'business-1',
      name: 'Acme',
    });
    (deps.clientRepository.findById as jest.Mock).mockResolvedValue(null);
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'draft',
      number: 'INV-1',
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

    await expect(service.createInvoice('business-1', input)).rejects.toThrow(
      'Client not found for this business',
    );
    await expect(
      service.updateInvoice('business-1', 'invoice-1', input),
    ).rejects.toThrow('Client not found for this business');
    expect(deps.save).not.toHaveBeenCalled();
  });

  it('sends a draft invoice, emails recipients, and transitions to sent', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      markSent,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const sent = await service.sendInvoice('business-1', 'invoice-1', {
      to: ['a@example.com', 'b@example.com'],
      cc: ['c@example.com'],
      subject: 'Your invoice',
    });

    expect(emailProvider.dispatch).toHaveBeenCalledWith('outbox-1');
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeDefined();
    expect(markSent).toHaveBeenCalledWith(
      'invoice-1',
      'business-1',
      sent.sentAt,
      expect.objectContaining({
        to: ['a@example.com', 'b@example.com'],
        cc: ['c@example.com'],
        subject: 'Your invoice',
      }),
    );
  });

  it('does not email when the draft-to-sent compare-and-set loses', async () => {
    const deps = createRepository();
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
    });
    deps.markSent.mockResolvedValue(null);
    const service = new InvoicesService(
      deps.invoiceRepository,
      deps.businessRepository,
      deps.clientRepository,
      deps.emailProvider,
      deps.paymentRepository,
      deps.activityEventRepository,
      deps.themeAssignment,
    );

    await expect(
      service.sendInvoice('business-1', 'invoice-1', {
        to: ['client@example.com'],
        subject: 'Invoice',
      }),
    ).rejects.toThrow('Only draft invoices can be sent');
    expect(deps.emailProvider.dispatch).not.toHaveBeenCalled();
  });

  it('fails before transitioning when email delivery is disabled', async () => {
    const deps = createRepository();
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
    });
    deps.emailProvider.assertAvailable.mockImplementation(() => {
      throw new Error('Email delivery is disabled');
    });
    const service = buildService(deps);

    await expect(
      service.sendInvoice('business-1', 'invoice-1', {
        to: ['client@example.com'],
        subject: 'Invoice',
      }),
    ).rejects.toThrow('Email delivery is disabled');
    expect(deps.markSent).not.toHaveBeenCalled();
  });

  it('returns the sent invoice when best-effort dispatch fails', async () => {
    const deps = createRepository();
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
    });
    deps.emailProvider.dispatch.mockResolvedValue(false);
    const service = buildService(deps);

    await expect(
      service.sendInvoice('business-1', 'invoice-1', {
        to: ['client@example.com'],
        subject: 'Invoice',
      }),
    ).resolves.toEqual(expect.objectContaining({ status: 'sent' }));
  });

  it('rejects sending when an email address is invalid', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      clientId: 'client-1',
      businessSnapshot: { displayName: 'Acme' },
      themeId: 'theme-1',
      themeVersionId: 'version-1',
      items: [{ description: 'Work', quantity: '1', rate: '10' }],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    await expect(
      service.sendInvoice('business-1', 'invoice-1', {
        to: ['not-an-email'],
        subject: 'Your invoice',
      }),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects sending an incomplete document before email delivery', async () => {
    const deps = createRepository();
    const service = buildService(deps);
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      businessSnapshot: { displayName: 'Acme' },
      items: [],
    });

    await expect(
      service.sendInvoice('business-1', 'invoice-1', {
        to: [],
        subject: 'Invoice',
      }),
    ).rejects.toThrow('Select a client');
    expect(deps.emailProvider.dispatch).not.toHaveBeenCalled();
    expect(deps.save).not.toHaveBeenCalled();
  });

  it('records a payment and marks a fully paid invoice as paid', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'sent',
      currencyCode: 'CAD',
      items: [{ quantity: '2', rate: '500', appliedTaxes: [] }],
    });
    paymentRepository.recordAtomically.mockResolvedValue({
      status: 'paid',
      updatedAt: '2026-08-22T00:00:00.000Z',
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const { invoice } = await service.recordPayment('business-1', 'invoice-1', {
      amount: '1000',
      paidAt: '2026-08-20T00:00:00.000Z',
    });

    expect(paymentRepository.recordAtomically).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: 'invoice-1',
        businessId: 'business-1',
        amount: '1000.00',
        invoiceTotal: '1000.00',
      }),
    );
    expect(invoice.status).toBe('paid');
    expect(save).not.toHaveBeenCalled();
    expect(activityEventRepository.record).not.toHaveBeenCalled();
  });

  it('records a partial payment and marks the invoice partially paid', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'sent',
      currencyCode: 'CAD',
      items: [{ quantity: '2', rate: '500', appliedTaxes: [] }],
    });
    paymentRepository.recordAtomically.mockResolvedValue({
      status: 'partially_paid',
      updatedAt: '2026-08-22T00:00:00.000Z',
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const { invoice } = await service.recordPayment('business-1', 'invoice-1', {
      amount: '250',
      paidAt: '2026-08-20T00:00:00.000Z',
    });

    expect(invoice.status).toBe('partially_paid');
    expect(paymentRepository.recordAtomically).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '250.00',
        invoiceTotal: '1000.00',
      }),
    );
    expect(save).not.toHaveBeenCalled();
    expect(activityEventRepository.record).not.toHaveBeenCalled();
  });

  it.each(['abc', '0', '-1', '0.001'])(
    'rejects invalid or nonpositive payment amount %s before persistence',
    async (amount) => {
      const deps = createRepository();
      const service = buildService(deps);
      (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
        id: 'invoice-1',
        businessId: 'business-1',
        status: 'sent',
        currencyCode: 'CAD',
        items: [{ quantity: '1', rate: '100', appliedTaxes: [] }],
      });

      await expect(
        service.recordPayment('business-1', 'invoice-1', {
          amount,
          paidAt: '2026-08-20T00:00:00.000Z',
        }),
      ).rejects.toThrow();
      expect(deps.paymentRepository.recordAtomically).not.toHaveBeenCalled();
    },
  );

  it('rejects payment for an ineligible invoice status', async () => {
    const deps = createRepository();
    const service = buildService(deps);
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'draft',
      currencyCode: 'CAD',
      items: [{ quantity: '1', rate: '100', appliedTaxes: [] }],
    });

    await expect(
      service.recordPayment('business-1', 'invoice-1', {
        amount: '10',
        paidAt: '2026-08-20T00:00:00.000Z',
      }),
    ).rejects.toThrow('Payments can only be recorded');
    expect(deps.paymentRepository.recordAtomically).not.toHaveBeenCalled();
  });

  it('rejects a payment that exceeds the remaining balance', async () => {
    const deps = createRepository();
    const service = buildService(deps);
    (deps.invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'partially_paid',
      currencyCode: 'CAD',
      items: [{ quantity: '1', rate: '100', appliedTaxes: [] }],
    });
    deps.paymentRepository.recordAtomically.mockRejectedValue(
      new PaymentRecordingError('overpayment'),
    );

    await expect(
      service.recordPayment('business-1', 'invoice-1', {
        amount: '25.01',
        paidAt: '2026-08-20T00:00:00.000Z',
      }),
    ).rejects.toThrow('Payment amount exceeds invoice balance');
    expect(deps.save).not.toHaveBeenCalled();
    expect(deps.activityEventRepository.record).not.toHaveBeenCalled();
  });

  it('derives the effective payment status when reading an invoice', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      status: 'sent',
      currencyCode: 'CAD',
      items: [{ quantity: '2', rate: '500', appliedTaxes: [] }],
    });
    paymentRepository.listByInvoice.mockResolvedValue([
      { id: 'p1', invoiceId: 'invoice-1', amount: '1000' },
    ]);
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const invoice = await service.getInvoiceWithStatus(
      'business-1',
      'invoice-1',
    );

    expect(invoice.status).toBe('paid');
  });

  it('duplicates an invoice as a new draft', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'sent',
      items: [],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const copy = await service.duplicateInvoice('business-1', 'invoice-1');

    expect(copy.id).not.toBe('invoice-1');
    expect(copy.number).toBe('COPY-INV-1');
    expect(copy.status).toBe('draft');
    expect(save).toHaveBeenCalled();
  });

  it('voids a sent invoice', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'sent',
      items: [],
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    const voided = await service.voidInvoice('business-1', 'invoice-1');

    expect(voided.status).toBe('void');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'void' }),
    );
  });

  it('deletes a draft invoice', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      items: [],
    });
    const del = jest.fn().mockResolvedValue(undefined);
    invoiceRepository.delete = del;
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      themeAssignment,
    );

    await service.deleteInvoice('business-1', 'invoice-1');

    expect(del).toHaveBeenCalledWith('invoice-1', 'business-1');
  });
});
