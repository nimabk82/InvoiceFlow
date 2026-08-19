import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../repositories/business.repository';

@Injectable()
export class BusinessAccessService {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
  ) {}

  async assertMember(accountId: string, businessId: string): Promise<void> {
    const isMember = await this.businessRepository.isMember(
      accountId,
      businessId,
    );

    if (!isMember) {
      throw new ForbiddenException();
    }
  }
}
