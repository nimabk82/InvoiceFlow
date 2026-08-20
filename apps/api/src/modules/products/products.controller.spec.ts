import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const createProduct = jest.fn().mockResolvedValue({});
  const findById = jest.fn().mockResolvedValue({});
  const updateProduct = jest.fn().mockResolvedValue({});
  const service = {
    list,
    createProduct,
    findById,
    updateProduct,
  } as unknown as ProductsService;
  const controller = new ProductsController(service);

  it('lists products with a search term', async () => {
    await controller.list('business-1', 'Consulting');

    expect(list).toHaveBeenCalledWith('business-1', {
      search: 'Consulting',
    });
  });

  it('creates a product for a business', async () => {
    const input = { type: 'service' as const, name: 'Consulting' };

    await controller.create('business-1', input);

    expect(createProduct).toHaveBeenCalledWith('business-1', input);
  });

  it('finds a product by id', async () => {
    await controller.findOne('business-1', 'p1');

    expect(findById).toHaveBeenCalledWith('business-1', 'p1');
  });

  it('updates a product by id', async () => {
    await controller.update('business-1', 'p1', {
      type: 'product' as const,
      name: 'New',
    });

    expect(updateProduct).toHaveBeenCalledWith('business-1', 'p1', {
      type: 'product',
      name: 'New',
    });
  });
});
