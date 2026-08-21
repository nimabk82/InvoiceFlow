import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { BusinessSettings } from '@invoiceflow/domain';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  BUSINESS_SETTINGS_REPOSITORY,
  type BusinessSettingsRepository,
} from './repositories/business-settings.repository';

export type UpdateBusinessSettingsInput = {
  bankTransferInstructions?: string;
  chequeInstructions?: string;
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  quotePrefix?: string;
  nextQuoteNumber?: number;
  accentColor?: string;
  style?: string;
};

@Injectable()
export class BusinessSettingsService {
  constructor(
    @Inject(BUSINESS_SETTINGS_REPOSITORY)
    private readonly settingsRepository: BusinessSettingsRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
  ) {}

  private async assertBusiness(businessId: string): Promise<void> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
  }

  async getSettings(businessId: string): Promise<BusinessSettings> {
    await this.assertBusiness(businessId);
    const existing = await this.settingsRepository.findByBusiness(businessId);
    return existing ?? { businessId };
  }

  async updateSettings(
    businessId: string,
    input: UpdateBusinessSettingsInput,
  ): Promise<BusinessSettings> {
    await this.assertBusiness(businessId);
    const existing = await this.settingsRepository.findByBusiness(businessId);

    const settings: BusinessSettings = {
      businessId,
      bankTransferInstructions:
        input.bankTransferInstructions ?? existing?.bankTransferInstructions,
      chequeInstructions:
        input.chequeInstructions ?? existing?.chequeInstructions,
      invoicePrefix: input.invoicePrefix ?? existing?.invoicePrefix,
      nextInvoiceNumber: input.nextInvoiceNumber ?? existing?.nextInvoiceNumber,
      quotePrefix: input.quotePrefix ?? existing?.quotePrefix,
      nextQuoteNumber: input.nextQuoteNumber ?? existing?.nextQuoteNumber,
      accentColor: input.accentColor ?? existing?.accentColor,
      style: input.style ?? existing?.style,
    };

    await this.settingsRepository.save(settings);

    return settings;
  }
}
