import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentDefaults } from '@invoiceflow/domain';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  DOCUMENT_DEFAULTS_REPOSITORY,
  type DocumentDefaultsRepository,
} from './repositories/document-defaults.repository';

export type UpdateDocumentDefaultsInput = {
  defaultDueRule?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  defaultInvoiceThemeId?: string;
  defaultQuoteThemeId?: string;
  defaultTaxIds?: string[];
};

@Injectable()
export class DocumentDefaultsService {
  constructor(
    @Inject(DOCUMENT_DEFAULTS_REPOSITORY)
    private readonly defaultsRepository: DocumentDefaultsRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
  ) {}

  private async assertBusiness(businessId: string): Promise<void> {
    const business = await this.businessRepository.findById(businessId);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
  }

  async getDefaults(businessId: string): Promise<DocumentDefaults> {
    await this.assertBusiness(businessId);
    const existing = await this.defaultsRepository.findByBusiness(businessId);
    return (
      existing ?? {
        businessId,
      }
    );
  }

  async updateDefaults(
    businessId: string,
    input: UpdateDocumentDefaultsInput,
  ): Promise<DocumentDefaults> {
    await this.assertBusiness(businessId);
    const existing = await this.defaultsRepository.findByBusiness(businessId);

    const defaults: DocumentDefaults = {
      businessId,
      defaultDueRule: input.defaultDueRule ?? existing?.defaultDueRule,
      defaultNotes: input.defaultNotes ?? existing?.defaultNotes,
      defaultTerms: input.defaultTerms ?? existing?.defaultTerms,
      defaultInvoiceThemeId:
        input.defaultInvoiceThemeId ?? existing?.defaultInvoiceThemeId,
      defaultQuoteThemeId:
        input.defaultQuoteThemeId ?? existing?.defaultQuoteThemeId,
      defaultTaxIds: input.defaultTaxIds ?? existing?.defaultTaxIds,
    };

    await this.defaultsRepository.save(defaults);

    return defaults;
  }
}
