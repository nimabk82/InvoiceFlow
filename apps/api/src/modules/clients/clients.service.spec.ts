import { ClientsService } from './clients.service';
import type { ClientRepository } from './repositories/client.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const save = jest.fn().mockResolvedValue(undefined);
  const repository = {
    findById: jest.fn(),
    list,
    save,
  } as unknown as ClientRepository;

  return { repository, list, save };
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

  it('creates a client and saves it', async () => {
    const { repository, save } = createRepository();
    const service = new ClientsService(repository);

    const client = await service.createClient('business-1', {
      name: 'Acme',
      emails: [{ address: 'a@b.com' }],
    });

    expect(client.businessId).toBe('business-1');
    expect(client.emails[0].isPrimary).toBe(true);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: client.id }),
    );
  });

  it('rejects when neither name nor company is provided', async () => {
    const { repository } = createRepository();
    const service = new ClientsService(repository);

    await expect(
      service.createClient('business-1', { emails: [] }),
    ).rejects.toThrow();
  });
});
