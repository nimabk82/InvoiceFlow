import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Business } from '@invoiceflow/domain';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from './repositories/business.repository';

export type CreateBusinessInput = {
  name: string;
  countryCode: string;
  currencyCode: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Business['address'];
  logoAssetId?: string;
};

export type UpdateBusinessInput = Partial<CreateBusinessInput>;

@Injectable()
export class BusinessesService {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
  ) {}

  async createBusiness(
    accountId: string,
    input: CreateBusinessInput,
  ): Promise<Business> {
    const name = input.name?.trim();
    const countryCode = input.countryCode?.trim();
    const currencyCode = input.currencyCode?.trim();

    if (!name || !countryCode || !currencyCode) {
      throw new BadRequestException(
        'name, countryCode, and currencyCode are required',
      );
    }

    const business: Business = {
      id: randomUUID(),
      ownerAccountId: accountId,
      name,
      countryCode,
      currencyCode,
      legalName: input.legalName?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      website: input.website?.trim() || undefined,
      address: input.address,
      logoAssetId: input.logoAssetId,
    };

    await this.businessRepository.save(business);
    await this.businessRepository.addMember(accountId, business.id, 'owner');

    return business;
  }

  async listForAccount(accountId: string): Promise<Business[]> {
    return this.businessRepository.listByOwner(accountId);
  }

  async findById(businessId: string): Promise<Business> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async updateBusiness(
    businessId: string,
    input: UpdateBusinessInput,
  ): Promise<Business> {
    const existing = await this.findById(businessId);

    const updated: Business = {
      ...existing,
      name: input.name?.trim() || existing.name,
      countryCode: input.countryCode?.trim() || existing.countryCode,
      currencyCode: input.currencyCode?.trim() || existing.currencyCode,
      legalName: input.legalName?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      website: input.website?.trim() || undefined,
      address: input.address ?? existing.address,
      logoAssetId: input.logoAssetId ?? existing.logoAssetId,
    };

    await this.businessRepository.save(updated);

    return updated;
  }
}
