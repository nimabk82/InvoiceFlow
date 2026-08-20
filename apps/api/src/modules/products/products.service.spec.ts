import { ProductsService } from './products.service';
import type { ProductServiceRepository } from './repositories/product-service.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const save = jest.fn().mockResolvedValue(undefined);
  const findById = jest.fn();
  const repository = {
    findById,
    list,
    save,
  } as unknown as ProductServiceRepository;

  return { repository, list, save, findById };
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

  it('finds a product by id', async () => {
    const { repository, findById } = createRepository();
    findById.mockResolvedValue({ id: 'p1' });
    const service = new ProductsService(repository);

    await expect(service.findById('business-1', 'p1')).resolves.toEqual({
      id: 'p1',
    });
    expect(findById).toHaveBeenCalledWith('p1', 'business-1');
  });

  it('creates a product and saves it', async () => {
    const { repository, save } = createRepository();
    const service = new ProductsService(repository);

    const product = await service.createProduct('business-1', {
      type: 'service',
      name: 'Consulting',
      defaultRate: '100',
    });

    expect(product.businessId).toBe('business-1');
    expect(product.type).toBe('service');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: product.id }),
    );
  });

  it('rejects when the product name is missing', async () => {
    const { repository } = createRepository();
    const service = new ProductsService(repository);

    await expect(
      service.createProduct('business-1', { type: 'product', name: '' }),
    ).rejects.toThrow();
  });

  it('updates an existing product and saves it', async () => {
    const { repository, save, findById } = createRepository();
    findById.mockResolvedValue({
      id: 'p1',
      businessId: 'business-1',
      type: 'service',
      name: 'Old',
    });
    const service = new ProductsService(repository);

    const updated = await service.updateProduct('business-1', 'p1', {
      type: 'service',
      name: 'New',
    });

    expect(updated.name).toBe('New');
    expect(save).toHaveBeenCalled();
  });

  it('throws when updating a missing product', async () => {
    const { repository, findById } = createRepository();
    findById.mockResolvedValue(null);
    const service = new ProductsService(repository);

    await expect(
      service.updateProduct('business-1', 'missing', {
        type: 'product',
        name: 'New',
      }),
    ).rejects.toThrow();
  });
});
