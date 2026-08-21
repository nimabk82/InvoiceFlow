import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Tax } from '@invoiceflow/domain';

import {
  TAX_REPOSITORY,
  type TaxRepository,
} from './repositories/tax.repository';

export type CreateTaxInput = {
  name: string;
  rate: string;
  registrationNumber?: string;
  isDefault?: boolean;
};

export type UpdateTaxInput = CreateTaxInput;

@Injectable()
export class TaxesService {
  constructor(
    @Inject(TAX_REPOSITORY)
    private readonly taxRepository: TaxRepository,
  ) {}

  async list(businessId: string): Promise<Tax[]> {
    return this.taxRepository.listByBusiness(businessId);
  }

  async findById(businessId: string, taxId: string): Promise<Tax | null> {
    return this.taxRepository.findById(taxId, businessId);
  }

  async createTax(businessId: string, input: CreateTaxInput): Promise<Tax> {
    const name = input.name?.trim();
    const rate = input.rate?.trim();

    if (!name || !rate) {
      throw new BadRequestException('Tax name and rate are required');
    }

    const tax: Tax = {
      id: randomUUID(),
      businessId,
      name,
      rate,
      registrationNumber: input.registrationNumber?.trim() || undefined,
      isDefault: input.isDefault ?? false,
    };

    await this.taxRepository.save(tax);

    return tax;
  }

  async updateTax(
    businessId: string,
    taxId: string,
    input: UpdateTaxInput,
  ): Promise<Tax> {
    const existing = await this.taxRepository.findById(taxId, businessId);

    if (!existing) {
      throw new NotFoundException('Tax not found');
    }

    const updated: Tax = {
      ...existing,
      name:
        input.name !== undefined
          ? input.name.trim() || existing.name
          : existing.name,
      rate:
        input.rate !== undefined
          ? input.rate.trim() || existing.rate
          : existing.rate,
      registrationNumber:
        input.registrationNumber !== undefined
          ? input.registrationNumber.trim() || undefined
          : existing.registrationNumber,
      isDefault: input.isDefault ?? existing.isDefault,
    };

    await this.taxRepository.save(updated);

    return updated;
  }
}
