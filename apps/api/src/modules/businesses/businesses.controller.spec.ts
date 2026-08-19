import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

describe('BusinessesController', () => {
  const createBusiness = jest.fn();
  const listForAccount = jest.fn();
  const service = {
    createBusiness,
    listForAccount,
  } as unknown as BusinessesService;
  const controller = new BusinessesController(service);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a business for the current account', async () => {
    createBusiness.mockResolvedValue({ id: 'b1' });

    await controller.create(
      { name: 'Acme', countryCode: 'CA', currencyCode: 'CAD' },
      { accountId: 'account-1' },
    );

    expect(createBusiness).toHaveBeenCalledWith('account-1', {
      name: 'Acme',
      countryCode: 'CA',
      currencyCode: 'CAD',
    });
  });

  it('lists businesses for the current account', async () => {
    listForAccount.mockResolvedValue([]);

    await controller.list({ accountId: 'account-1' });

    expect(listForAccount).toHaveBeenCalledWith('account-1');
  });
});
