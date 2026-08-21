import type { BusinessRepository } from '../businesses/repositories/business.repository';
import { DocumentDefaultsService } from './document-defaults.service';
import type { DocumentDefaultsRepository } from './repositories/document-defaults.repository';

function createDeps() {
  const findById = jest.fn();
  const findByBusiness = jest.fn().mockResolvedValue(null);
  const save = jest.fn().mockResolvedValue(undefined);
  const defaultsRepository = {
    findByBusiness,
    save,
  } as unknown as DocumentDefaultsRepository;
  const businessRepository = { findById } as unknown as BusinessRepository;
  return { defaultsRepository, businessRepository, findById, save };
}

describe('DocumentDefaultsService', () => {
  it('returns an empty defaults object when none exist', async () => {
    const { defaultsRepository, businessRepository, findById } = createDeps();
    findById.mockResolvedValue({ id: 'business-1' });
    const service = new DocumentDefaultsService(
      defaultsRepository,
      businessRepository,
    );

    const result = await service.getDefaults('business-1');

    expect(result).toEqual({ businessId: 'business-1' });
  });

  it('persists updated defaults', async () => {
    const { defaultsRepository, businessRepository, findById, save } =
      createDeps();
    findById.mockResolvedValue({ id: 'business-1' });
    const service = new DocumentDefaultsService(
      defaultsRepository,
      businessRepository,
    );

    const result = await service.updateDefaults('business-1', {
      defaultDueRule: 'days_15',
      defaultTerms: 'Net 15',
    });

    expect(result.defaultDueRule).toBe('days_15');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ defaultDueRule: 'days_15' }),
    );
  });
});
