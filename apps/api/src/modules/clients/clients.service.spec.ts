import { ClientsService } from './clients.service';
import type { ClientRepository } from './repositories/client.repository';

function createRepository() {
  const list = jest.fn().mockResolvedValue({ items: [] });
  const save = jest.fn().mockResolvedValue(undefined);
  const findById = jest.fn();
  const repository = {
    findById,
    list,
    save,
  } as unknown as ClientRepository;

  return { repository, list, save, findById };
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

  it('finds a client by id', async () => {
    const { repository, findById } = createRepository();
    findById.mockResolvedValue({ id: 'c1' });
    const service = new ClientsService(repository);

    await expect(service.findById('business-1', 'c1')).resolves.toEqual({
      id: 'c1',
    });
    expect(findById).toHaveBeenCalledWith('c1', 'business-1');
  });

  it('updates an existing client and saves it', async () => {
    const { repository, save, findById } = createRepository();
    findById.mockResolvedValue({
      id: 'c1',
      businessId: 'business-1',
      name: 'Old',
      emails: [],
    });
    const service = new ClientsService(repository);

    const updated = await service.updateClient('business-1', 'c1', {
      name: 'New',
    });

    expect(updated.name).toBe('New');
    expect(save).toHaveBeenCalled();
  });

  it('throws when updating a missing client', async () => {
    const { repository, findById } = createRepository();
    findById.mockResolvedValue(null);
    const service = new ClientsService(repository);

    await expect(
      service.updateClient('business-1', 'missing', { name: 'New' }),
    ).rejects.toThrow();
  });
});
