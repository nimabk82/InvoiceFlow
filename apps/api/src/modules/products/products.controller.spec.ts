import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const service = { list } as unknown as ProductsService;
  const controller = new ProductsController(service);

  it('lists products with a search term', async () => {
    await controller.list('business-1', 'Consulting');

    expect(list).toHaveBeenCalledWith('business-1', {
      search: 'Consulting',
    });
  });
});
