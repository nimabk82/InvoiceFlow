import { ProductsService } from './products.service';
import type { ProductServiceRepository } from './repositories/product-service.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const repository = {
    findById: jest.fn(),
    list,
    save: jest.fn(),
  } as unknown as ProductServiceRepository;

  return { repository, list };
}

describe('ProductsService', () => {
  it('lists products for a business with options', async () => {
    const { repository, list } = createRepository();
    const service = new ProductsService(repository);

    await service.list('business-1', { search: 'Consulting' });

    expect(list).toHaveBeenCalledWith({
      businessId: 'business-1',
      search: 'Consulting',
    });
  });
});
