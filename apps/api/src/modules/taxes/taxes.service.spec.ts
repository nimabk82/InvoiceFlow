import type { TaxRepository } from './repositories/tax.repository';
import { TaxesService } from './taxes.service';

function createRepo() {
  const findById = jest.fn();
  const listByBusiness = jest.fn().mockResolvedValue([]);
  const save = jest.fn().mockResolvedValue(undefined);
  const repo = {
    findById,
    listByBusiness,
    save,
  } as unknown as TaxRepository;
  return { repo, findById, listByBusiness, save };
}

describe('TaxesService', () => {
  it('lists taxes for a business', async () => {
    const { repo, listByBusiness } = createRepo();
    const service = new TaxesService(repo);

    await service.list('business-1');

    expect(listByBusiness).toHaveBeenCalledWith('business-1');
  });

  it('creates a tax', async () => {
    const { repo, save } = createRepo();
    const service = new TaxesService(repo);

    const tax = await service.createTax('business-1', {
      name: 'HST',
      rate: '13',
    });

    expect(tax.name).toBe('HST');
    expect(tax.businessId).toBe('business-1');
    expect(tax.isDefault).toBe(false);
    expect(save).toHaveBeenCalled();
  });

  it('rejects a tax without a rate', async () => {
    const { repo } = createRepo();
    const service = new TaxesService(repo);

    await expect(
      service.createTax('business-1', { name: 'HST', rate: '' }),
    ).rejects.toThrow();
  });
});
