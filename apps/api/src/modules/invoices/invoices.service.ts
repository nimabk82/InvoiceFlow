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
  Invoice,
} from '@invoiceflow/domain';

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
  INVOICE_REPOSITORY,
  type InvoicePage,
  type InvoiceRepository,
} from './repositories/invoice.repository';

export type CreateInvoiceItemInput = {
  description: string;
  secondaryDescription?: string;
  quantity: string;
  rate: string;
  appliedTaxes?: { name: string; rate: string }[];
};

export type DepositDueRule = 'on_receipt' | 'days_7' | 'days_15' | 'custom';

export type CreateInvoiceDepositInput = {
  type: 'percentage' | 'fixed';
  value: string;
  dueRule: DepositDueRule;
  dueDate?: string;
};

export type CreateInvoiceDiscountInput = {
  type: 'percentage' | 'fixed';
  value: string;
};

export type CreateInvoiceInput = {
  number?: string;
  clientId?: string;
  issueDate: string;
  dueDate?: string;
  currencyCode: string;
  poNumber?: string;
  items: CreateInvoiceItemInput[];
  depositTerms?: CreateInvoiceDepositInput;
  discount?: CreateInvoiceDiscountInput;
};

export type ListInvoicesOptions = {
  status?: Invoice['status'];
  limit?: number;
};

export type SendInvoiceInput = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  message?: string;
};

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
  ) {}

  async list(
    businessId: string,
    options?: ListInvoicesOptions,
  ): Promise<InvoicePage> {
    return this.invoiceRepository.list({ businessId, ...options });
  }

  async findById(businessId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(
      invoiceId,
      businessId,
    );

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async sendInvoice(
    businessId: string,
    invoiceId: string,
    input: SendInvoiceInput,
  ): Promise<Invoice> {
    const invoice = await this.findById(businessId, invoiceId);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    const to = input.to ?? [];
    const cc = input.cc ?? [];
    const bcc = input.bcc ?? [];

    const invalidEmail = [...to, ...cc, ...bcc].find(
      (email) => !isValidEmail(email),
    );

    if (invalidEmail !== undefined) {
      throw new BadRequestException(`Invalid email address: ${invalidEmail}`);
    }

    const subject =
      input.subject?.trim() ||
      `Invoice ${invoice.number} from ${invoice.businessSnapshot.displayName}`;

    await this.emailProvider.send({
      to: [...to, ...cc, ...bcc],
      subject,
      text: input.message,
    });

    const sent: Invoice = {
      ...invoice,
      status: 'sent',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(sent);

    return sent;
  }

  async createInvoice(
    businessId: string,
    input: CreateInvoiceInput,
  ): Promise<Invoice> {
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

    const invoice: Invoice = {
      id: randomUUID(),
      businessId,
      number: input.number?.trim() || `INV-${Date.now()}`,
      clientId: input.clientId,
      clientSnapshot: client
        ? toClientSnapshot(client)
        : { displayName: 'Draft', emails: [] },
      businessSnapshot: toBusinessSnapshot(business),
      currencyCode,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
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
      poNumber: input.poNumber,
      discount: input.discount,
      depositTerms: input.depositTerms,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(invoice);

    return invoice;
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
