import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const service = { list } as unknown as ClientsService;
  const controller = new ClientsController(service);

  it('lists clients with a search term', async () => {
    await controller.list('business-1', 'Acme');

    expect(list).toHaveBeenCalledWith('business-1', { search: 'Acme' });
  });

  it('includes archived clients when requested', async () => {
    await controller.list('business-1', undefined, 'true');

    expect(list).toHaveBeenCalledWith('business-1', {
      search: undefined,
      includeArchived: true,
    });
  });
});
