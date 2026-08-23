import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  ActivityEvent,
  Business,
  BusinessSnapshot,
  Client,
  ClientSnapshot,
  Invoice,
  Quote,
} from '@invoiceflow/domain';
import { validateFinalDocumentForSend } from '@invoiceflow/validation';

import {
  ACTIVITY_EVENT_REPOSITORY,
  type ActivityEventRepository,
} from '../audit/repositories/activity-event.repository';
import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository';
import { EMAIL_PROVIDER, type EmailProvider } from '../email/email-provider';
import {
  ThemeAssignmentService,
  type ThemeAssignment,
} from '../theme-assignment/theme-assignment.service';
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
  sourceProductServiceId?: string;
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
  themeId?: string;
  items: CreateQuoteItemInput[];
  proposedDepositTerms?: CreateQuoteDepositInput;
};

export type ListQuotesOptions = {
  status?: Quote['status'];
  limit?: number;
};

export type SendQuoteInput = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  message?: string;
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
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
    @Inject(ACTIVITY_EVENT_REPOSITORY)
    private readonly activityEventRepository: ActivityEventRepository,
    private readonly themeAssignment: ThemeAssignmentService,
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

    if (input.clientId && !client) {
      throw new BadRequestException('Client not found for this business');
    }

    const assignment: ThemeAssignment | undefined =
      (await this.themeAssignment.resolveById(input.themeId, businessId)) ??
      (await this.themeAssignment.resolveDefault(businessId, 'quote'));

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
      themeId: assignment?.themeId,
      themeVersionId: assignment?.themeVersionId,
      themeNameSnapshot: assignment?.themeName,
      items: input.items.map((item) => ({
        id: randomUUID(),
        sourceProductServiceId: item.sourceProductServiceId,
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

  async updateQuote(
    businessId: string,
    quoteId: string,
    input: CreateQuoteInput,
  ): Promise<Quote> {
    const existing = await this.findById(businessId, quoteId);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be edited');
    }

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

    if (input.clientId && !client) {
      throw new BadRequestException('Client not found for this business');
    }

    const assignment: ThemeAssignment | undefined =
      (await this.themeAssignment.resolveById(input.themeId, businessId)) ??
      (await this.themeAssignment.resolveDefault(businessId, 'quote'));

    const updated: Quote = {
      ...existing,
      number: input.number?.trim() || existing.number,
      clientId: input.clientId,
      clientSnapshot: client
        ? toClientSnapshot(client)
        : existing.clientSnapshot,
      currencyCode,
      issueDate: input.issueDate,
      validUntil: input.validUntil,
      themeId: assignment?.themeId ?? existing.themeId,
      themeVersionId: assignment?.themeVersionId ?? existing.themeVersionId,
      themeNameSnapshot: assignment?.themeName ?? existing.themeNameSnapshot,
      items: input.items.map((item) => ({
        id: randomUUID(),
        sourceProductServiceId: item.sourceProductServiceId,
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
      updatedAt: new Date().toISOString(),
    };

    await this.quoteRepository.save(updated);

    return updated;
  }

  async sendQuote(
    businessId: string,
    quoteId: string,
    input: SendQuoteInput,
  ): Promise<Quote> {
    const quote = await this.findById(businessId, quoteId);

    if (quote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be sent');
    }

    const to = input.to ?? [];
    const cc = input.cc ?? [];
    const bcc = input.bcc ?? [];

    const validation = validateFinalDocumentForSend({
      clientSelected: Boolean(quote.clientId),
      items: quote.items,
      themeId: quote.themeId,
      themeVersionId: quote.themeVersionId,
      to,
      cc,
      bcc,
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.issues[0]?.message);
    }

    const subject =
      input.subject?.trim() ||
      `Quote ${quote.number} from ${quote.businessSnapshot.displayName}`;

    this.emailProvider.assertAvailable?.();

    const sentAt = new Date().toISOString();
    const sent: Quote = {
      ...quote,
      status: 'sent',
      sentAt,
      updatedAt: sentAt,
    };

    const transitioned = await this.quoteRepository.markSent(
      quoteId,
      businessId,
      sentAt,
    );
    if (!transitioned) {
      throw new BadRequestException('Only draft quotes can be sent');
    }

    await this.emailProvider.send({
      to: [...to, ...cc, ...bcc],
      subject,
      text: input.message,
    });
    await this.recordActivity(businessId, quoteId, 'sent');

    return sent;
  }

  async acceptQuote(businessId: string, quoteId: string): Promise<Quote> {
    const quote = await this.findById(businessId, quoteId);

    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      throw new BadRequestException('Only sent quotes can be accepted');
    }

    const accepted: Quote = {
      ...quote,
      status: 'accepted',
      updatedAt: new Date().toISOString(),
    };

    await this.quoteRepository.save(accepted);
    await this.recordActivity(businessId, quoteId, 'accepted');

    return accepted;
  }

  async declineQuote(businessId: string, quoteId: string): Promise<Quote> {
    const quote = await this.findById(businessId, quoteId);

    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      throw new BadRequestException('Only sent quotes can be declined');
    }

    const declined: Quote = {
      ...quote,
      status: 'declined',
      updatedAt: new Date().toISOString(),
    };

    await this.quoteRepository.save(declined);
    await this.recordActivity(businessId, quoteId, 'declined');

    return declined;
  }

  async convertQuote(
    businessId: string,
    quoteId: string,
  ): Promise<{ quote: Quote; invoice: Invoice }> {
    const quote = await this.findById(businessId, quoteId);

    if (quote.status !== 'accepted') {
      throw new BadRequestException(
        'Only accepted quotes can be converted to an invoice',
      );
    }

    const convertedAt = new Date().toISOString();
    const invoice: Invoice = {
      id: randomUUID(),
      businessId,
      number: `INV-${Date.now()}`,
      clientId: quote.clientId,
      clientSnapshot: quote.clientSnapshot,
      businessSnapshot: quote.businessSnapshot,
      currencyCode: quote.currencyCode,
      issueDate: new Date().toISOString().slice(0, 10),
      items: quote.items.map((item) => ({
        ...item,
        id: randomUUID(),
      })),
      themeId: quote.themeId,
      themeVersionId: quote.themeVersionId,
      themeNameSnapshot: quote.themeNameSnapshot,
      depositTerms: quote.proposedDepositTerms,
      notes: quote.notes,
      terms: quote.terms,
      status: 'draft',
      sourceQuoteId: quote.id,
      createdAt: convertedAt,
      updatedAt: convertedAt,
    };

    const updated: Quote = {
      ...quote,
      convertedInvoiceIds: [...quote.convertedInvoiceIds, invoice.id],
      updatedAt: convertedAt,
    };

    const converted = await this.quoteRepository.convertToInvoice(
      quote,
      invoice,
    );
    if (!converted) {
      throw new BadRequestException(
        'Quote changed before it could be converted; retry the conversion',
      );
    }
    await this.recordActivity(businessId, quoteId, 'converted', {
      invoiceId: invoice.id,
    });

    return { quote: updated, invoice };
  }

  async adoptLatestTheme(businessId: string, quoteId: string): Promise<Quote> {
    const quote = await this.findById(businessId, quoteId);

    if (quote.status !== 'draft') {
      throw new BadRequestException(
        'Only draft quotes can adopt a newer theme version',
      );
    }

    const assignment = await this.themeAssignment.resolveById(
      quote.themeId,
      businessId,
    );

    if (!assignment) {
      throw new BadRequestException('Quote has no theme to update');
    }

    const updated: Quote = {
      ...quote,
      themeId: assignment.themeId,
      themeVersionId: assignment.themeVersionId,
      themeNameSnapshot: assignment.themeName,
      updatedAt: new Date().toISOString(),
    };

    await this.quoteRepository.save(updated);

    return updated;
  }

  async listActivity(
    businessId: string,
    quoteId: string,
  ): Promise<ActivityEvent[]> {
    await this.findById(businessId, quoteId);
    const page = await this.activityEventRepository.list({
      businessId,
      entityType: 'quote',
      entityId: quoteId,
    });
    return [...page.items];
  }

  private async recordActivity(
    businessId: string,
    quoteId: string,
    type: ActivityEvent['type'],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.activityEventRepository.record({
      id: randomUUID(),
      businessId,
      entityType: 'quote',
      entityId: quoteId,
      type,
      occurredAt: new Date().toISOString(),
      metadata,
    });
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
