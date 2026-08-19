import { ClientsService } from './clients.service';
import type { ClientRepository } from './repositories/client.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const repository = {
    findById: jest.fn(),
    list,
    save: jest.fn(),
  } as unknown as ClientRepository;

  return { repository, list };
}

describe('ClientsService', () => {
  it('lists clients for a business with options', async () => {
    const { repository, list } = createRepository();
    const service = new ClientsService(repository);

    await service.list('business-1', { search: 'Acme' });

    expect(list).toHaveBeenCalledWith({
      businessId: 'business-1',
      search: 'Acme',
    });
  });

  it('lists clients without options', async () => {
    const { repository, list } = createRepository();
    const service = new ClientsService(repository);

    await service.list('business-1');

    expect(list).toHaveBeenCalledWith({ businessId: 'business-1' });
  });
});
