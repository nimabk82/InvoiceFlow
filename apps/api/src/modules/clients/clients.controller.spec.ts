import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const createClient = jest.fn().mockResolvedValue({});
  const findById = jest.fn().mockResolvedValue({});
  const updateClient = jest.fn().mockResolvedValue({});
  const service = {
    list,
    createClient,
    findById,
    updateClient,
  } as unknown as ClientsService;
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

  it('creates a client for a business', async () => {
    const input = { name: 'Acme', emails: [{ address: 'a@b.com' }] };

    await controller.create('business-1', input);

    expect(createClient).toHaveBeenCalledWith('business-1', input);
  });

  it('finds a client by id', async () => {
    await controller.findOne('business-1', 'c1');

    expect(findById).toHaveBeenCalledWith('business-1', 'c1');
  });

  it('updates a client by id', async () => {
    await controller.update('business-1', 'c1', { name: 'New' });

    expect(updateClient).toHaveBeenCalledWith('business-1', 'c1', {
      name: 'New',
    });
  });
});
