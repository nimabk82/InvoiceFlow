import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

describe('InvoicesController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const createInvoice = jest.fn().mockResolvedValue({});
  const service = { list, createInvoice } as unknown as InvoicesService;
  const controller = new InvoicesController(service);

  it('lists invoices for a business', async () => {
    await controller.list('business-1', 'draft');

    expect(list).toHaveBeenCalledWith('business-1', { status: 'draft' });
  });

  it('ignores an invalid status filter', async () => {
    await controller.list('business-1', 'not-a-status');

    expect(list).toHaveBeenCalledWith('business-1', {});
  });

  it('creates an invoice for a business', async () => {
    const input = {
      issueDate: '2026-08-01',
      currencyCode: 'CAD',
      items: [{ description: 'Consulting', quantity: '1', rate: '5000' }],
    };

    await controller.create('business-1', input);

    expect(createInvoice).toHaveBeenCalledWith('business-1', input);
  });
});
