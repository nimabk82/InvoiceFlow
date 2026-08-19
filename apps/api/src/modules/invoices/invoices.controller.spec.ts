import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

describe('InvoicesController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const service = { list } as unknown as InvoicesService;
  const controller = new InvoicesController(service);

  it('lists invoices for a business', async () => {
    await controller.list('business-1', 'draft');

    expect(list).toHaveBeenCalledWith('business-1', { status: 'draft' });
  });

  it('ignores an invalid status filter', async () => {
    await controller.list('business-1', 'not-a-status');

    expect(list).toHaveBeenCalledWith('business-1', {});
  });
});
