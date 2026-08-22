import type { BusinessRepository } from '../businesses/repositories/business.repository';
import type { ClientRepository } from '../clients/repositories/client.repository';
import { InvoicesService } from './invoices.service';
import type { InvoiceRepository } from './repositories/invoice.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const save = jest.fn().mockResolvedValue(undefined);
  const invoiceRepository = {
    findById: jest.fn(),
    list,
    save,
  } as unknown as InvoiceRepository;
  const businessRepository = {
    findById: jest.fn(),
  } as unknown as BusinessRepository;
  const clientRepository = {
    findById: jest.fn(),
  } as unknown as ClientRepository;
  const emailProvider = {
    send: jest.fn().mockResolvedValue({ accepted: true }),
  };
  const paymentRepository = {
    findById: jest.fn(),
    listByInvoice: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const activityEventRepository = {
    record: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue({ items: [] }),
  };

  return {
    invoiceRepository,
    businessRepository,
    clientRepository,
    emailProvider,
    paymentRepository,
    activityEventRepository,
    list,
    save,
  };
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
      list,
    } = createRepository();
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
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

  it('rejects when required fields are missing', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
    } = createRepository();
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
    );

    await expect(
      service.createInvoice('business-1', {
        issueDate: '',
        currencyCode: 'CAD',
        items: [],
      }),
    ).rejects.toThrow();
  });

  it('sends a draft invoice, emails recipients, and transitions to sent', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      businessSnapshot: { displayName: 'Acme' },
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
    );

    const sent = await service.sendInvoice('business-1', 'invoice-1', {
      to: ['a@example.com', 'b@example.com'],
      cc: ['c@example.com'],
      subject: 'Your invoice',
    });

    expect(emailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['a@example.com', 'b@example.com', 'c@example.com'],
        subject: 'Your invoice',
      }),
    );
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeDefined();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent' }),
    );
  });

  it('rejects sending when an email address is invalid', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      number: 'INV-1',
      status: 'draft',
      businessSnapshot: { displayName: 'Acme' },
    });
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
    );

    await expect(
      service.sendInvoice('business-1', 'invoice-1', {
        to: ['not-an-email'],
        subject: 'Your invoice',
      }),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });

  it('records a payment and marks a fully paid invoice as paid', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      currencyCode: 'CAD',
      items: [{ quantity: '2', rate: '500', appliedTaxes: [] }],
    });
    paymentRepository.listByInvoice.mockResolvedValue([
      { id: 'p1', invoiceId: 'invoice-1', amount: '500' },
      { id: 'p2', invoiceId: 'invoice-1', amount: '500' },
    ]);
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
    );

    const { invoice } = await service.recordPayment('business-1', 'invoice-1', {
      amount: '500',
      paidAt: '2026-08-20T00:00:00.000Z',
    });

    expect(paymentRepository.save).toHaveBeenCalled();
    expect(invoice.status).toBe('paid');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid' }),
    );
  });

  it('records a partial payment and marks the invoice partially paid', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
      save,
    } = createRepository();
    (invoiceRepository.findById as jest.Mock).mockResolvedValue({
      id: 'invoice-1',
      businessId: 'business-1',
      currencyCode: 'CAD',
      items: [{ quantity: '2', rate: '500', appliedTaxes: [] }],
    });
    paymentRepository.listByInvoice.mockResolvedValue([
      { id: 'p1', invoiceId: 'invoice-1', amount: '250' },
    ]);
    const service = new InvoicesService(
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
    );

    const { invoice } = await service.recordPayment('business-1', 'invoice-1', {
      amount: '250',
      paidAt: '2026-08-20T00:00:00.000Z',
    });

    expect(invoice.status).toBe('partially_paid');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'partially_paid' }),
    );
  });

  it('derives the effective payment status when reading an invoice', async () => {
    const {
      invoiceRepository,
      businessRepository,
      clientRepository,
      emailProvider,
      paymentRepository,
      activityEventRepository,
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
    );

    await service.deleteInvoice('business-1', 'invoice-1');

    expect(del).toHaveBeenCalledWith('invoice-1', 'business-1');
  });
});
