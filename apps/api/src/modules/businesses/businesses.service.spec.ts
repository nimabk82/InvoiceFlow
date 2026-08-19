import { BadRequestException } from '@nestjs/common';

import { BusinessesService } from './businesses.service';
import type { BusinessRepository } from './repositories/business.repository';

function createRepository() {
  const save = jest.fn().mockResolvedValue(undefined);
  const addMember = jest.fn().mockResolvedValue(undefined);
  const listByOwner = jest.fn().mockResolvedValue([]);

  return {
    repository: {
      save,
      addMember,
      listByOwner,
    } as unknown as BusinessRepository,
    save,
    addMember,
    listByOwner,
  };
}

describe('BusinessesService', () => {
  it('creates a business and adds the owner membership', async () => {
    const { repository, save, addMember } = createRepository();
    const service = new BusinessesService(repository);

    const business = await service.createBusiness('account-1', {
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });

    expect(business.ownerAccountId).toBe('account-1');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: business.id }),
    );
    expect(addMember).toHaveBeenCalledWith('account-1', business.id, 'owner');
  });

  it('rejects when required fields are missing', async () => {
    const { repository } = createRepository();
    const service = new BusinessesService(repository);

    await expect(
      service.createBusiness('account-1', {
        name: '',
        countryCode: 'CA',
        currencyCode: 'CAD',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists businesses for an account', async () => {
    const { repository, listByOwner } = createRepository();
    listByOwner.mockResolvedValue([{ id: 'b1' }]);
    const service = new BusinessesService(repository);

    await expect(service.listForAccount('account-1')).resolves.toEqual([
      { id: 'b1' },
    ]);
  });
});
