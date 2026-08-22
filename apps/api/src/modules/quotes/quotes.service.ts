import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  Business,
  BusinessSnapshot,
  Client,
  ClientSnapshot,
  Quote,
} from '@invoiceflow/domain';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository';
import {
  QUOTE_REPOSITORY,
  type QuotePage,
  type QuoteRepository,
} from './repositories/quote.repository';

export type CreateQuoteItemInput = {
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  appliedTaxes?: { name: string; rate: string }[];
};

export type QuoteDepositDueRule =
  | 'on_receipt'
  | 'days_7'
  | 'days_15'
  | 'custom';

export type CreateQuoteDepositInput = {
  type: 'percentage' | 'fixed';
  value: string;
  dueRule: QuoteDepositDueRule;
  dueDate?: string;
};

export type CreateQuoteInput = {
  number?: string;
  clientId?: string;
  issueDate: string;
  validUntil?: string;
  currencyCode: string;
  items: CreateQuoteItemInput[];
  proposedDepositTerms?: CreateQuoteDepositInput;
};

export type ListQuotesOptions = {
  status?: Quote['status'];
  limit?: number;
};

@Injectable()
export class QuotesService {
  constructor(
    @Inject(QUOTE_REPOSITORY)
    private readonly quoteRepository: QuoteRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async list(
    businessId: string,
    options?: ListQuotesOptions,
  ): Promise<QuotePage> {
    return this.quoteRepository.list({ businessId, ...options });
  }

  async findById(businessId: string, quoteId: string): Promise<Quote> {
    const quote = await this.quoteRepository.findById(quoteId, businessId);

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async createQuote(
    businessId: string,
    input: CreateQuoteInput,
  ): Promise<Quote> {
    const currencyCode = input.currencyCode?.trim();

    if (!currencyCode || !input.issueDate) {
      throw new BadRequestException('currencyCode and issueDate are required');
    }

    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const client = input.clientId
      ? await this.clientRepository.findById(input.clientId, businessId)
      : undefined;

    const quote: Quote = {
      id: randomUUID(),
      businessId,
      number: input.number?.trim() || `Q-${Date.now()}`,
      clientId: input.clientId,
      clientSnapshot: client
        ? toClientSnapshot(client)
        : { displayName: 'Draft', emails: [] },
      businessSnapshot: toBusinessSnapshot(business),
      currencyCode,
      issueDate: input.issueDate,
      validUntil: input.validUntil,
      items: input.items.map((item) => ({
        id: randomUUID(),
        description: item.description,
        secondaryDescription: item.secondaryDescription,
        quantity: item.quantity,
        rate: item.rate,
        appliedTaxes: (item.appliedTaxes ?? []).map((tax) => ({
          name: tax.name,
          rate: tax.rate,
        })),
      })),
      proposedDepositTerms: input.proposedDepositTerms,
      status: 'draft',
      convertedInvoiceIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.quoteRepository.save(quote);

    return quote;
  }
}

function toBusinessSnapshot(business: Business): BusinessSnapshot {
  return {
    displayName: business.name,
    legalName: business.legalName,
    email: business.email,
    phone: business.phone,
    website: business.website,
    address: business.address,
    taxNumbers: [],
    logoAssetId: business.logoAssetId,
  };
}

function toClientSnapshot(client: Client): ClientSnapshot {
  return {
    displayName: client.company ?? client.name ?? 'Client',
    emails: client.emails.map((email) => email.address),
    phone: client.phone,
    address: client.billingAddress,
    taxNumber: client.taxNumber,
  };
}
