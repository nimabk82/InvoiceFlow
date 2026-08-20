import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const createClient = jest.fn().mockResolvedValue({});
  const service = { list, createClient } as unknown as ClientsService;
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
});
