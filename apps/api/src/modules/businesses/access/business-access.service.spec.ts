import { ForbiddenException } from '@nestjs/common';

import type { BusinessRepository } from '../repositories/business.repository';
import { BusinessAccessService } from './business-access.service';

function createRepository(isMember: jest.Mock): BusinessRepository {
  return { isMember } as unknown as BusinessRepository;
}

describe('BusinessAccessService', () => {
  const accountId = 'account-1';
  const businessId = 'business-1';

  it('allows an account that is a member', async () => {
    const service = new BusinessAccessService(
      createRepository(jest.fn().mockResolvedValue(true)),
    );

    await expect(
      service.assertMember(accountId, businessId),
    ).resolves.toBeUndefined();
  });

  it('rejects an account that is not a member', async () => {
    const service = new BusinessAccessService(
      createRepository(jest.fn().mockResolvedValue(false)),
    );

    await expect(
      service.assertMember(accountId, businessId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
