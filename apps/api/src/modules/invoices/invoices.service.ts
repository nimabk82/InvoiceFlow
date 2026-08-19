import { Inject, Injectable } from '@nestjs/common';
import type { InvoiceStatus } from '@invoiceflow/domain';

import {
  INVOICE_REPOSITORY,
  type InvoicePage,
  type InvoiceRepository,
} from './repositories/invoice.repository';

export type ListInvoicesOptions = {
  status?: InvoiceStatus;
  limit?: number;
};

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async list(
    businessId: string,
    options?: ListInvoicesOptions,
  ): Promise<InvoicePage> {
    return this.invoiceRepository.list({ businessId, ...options });
  }
}
