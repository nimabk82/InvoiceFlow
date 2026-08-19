import { InvoicesService } from './invoices.service';
import type { InvoiceRepository } from './repositories/invoice.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const repository = {
    findById: jest.fn(),
    list,
    save: jest.fn(),
  } as unknown as InvoiceRepository;

  return { repository, list };
}

describe('InvoicesService', () => {
  it('lists invoices for a business with an optional status', async () => {
    const { repository, list } = createRepository();
    const service = new InvoicesService(repository);

    await service.list('business-1', { status: 'draft' });

    expect(list).toHaveBeenCalledWith({
      businessId: 'business-1',
      status: 'draft',
    });
  });
});
