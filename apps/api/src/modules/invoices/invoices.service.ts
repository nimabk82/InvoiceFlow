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
  ActivityEvent,
  Invoice,
  Payment,
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
  ACTIVITY_EVENT_REPOSITORY,
  type ActivityEventRepository,
} from '../audit/repositories/activity-event.repository';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../payments/repositories/payment.repository';
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

export type RecordPaymentInput = {
  amount: string;
  paidAt: string;
  method?: string;
  reference?: string;
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
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(ACTIVITY_EVENT_REPOSITORY)
    private readonly activityEventRepository: ActivityEventRepository,
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
    await this.recordActivity(businessId, invoiceId, 'sent');

    return sent;
  }

  async listPayments(
    businessId: string,
    invoiceId: string,
  ): Promise<Payment[]> {
    await this.findById(businessId, invoiceId);
    return this.paymentRepository.listByInvoice(invoiceId);
  }

  async recordPayment(
    businessId: string,
    invoiceId: string,
    input: RecordPaymentInput,
  ): Promise<{ invoice: Invoice; paymentId: string }> {
    if (input.amount === undefined || input.amount.trim() === '') {
      throw new BadRequestException('Payment amount is required');
    }

    if (!input.paidAt) {
      throw new BadRequestException('Payment date is required');
    }

    const invoice = await this.findById(businessId, invoiceId);

    const paymentId = randomUUID();
    await this.paymentRepository.save({
      id: paymentId,
      invoiceId,
      amount: input.amount,
      paidAt: input.paidAt,
      method: input.method,
      reference: input.reference,
    });

    const payments = await this.paymentRepository.listByInvoice(invoiceId);
    const total = computeInvoiceTotal(invoice);
    const paid = payments.reduce(
      (sum, payment) => sum + toUnits(payment.amount),
      0n,
    );

    const status = derivePaymentStatus(invoice.status, total, paid);

    const updated: Invoice = {
      ...invoice,
      status,
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(updated);
    await this.recordActivity(businessId, invoiceId, 'payment_recorded', {
      amount: input.amount,
    });

    return { invoice: updated, paymentId };
  }

  async getInvoiceWithStatus(
    businessId: string,
    invoiceId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(businessId, invoiceId);
    const payments = await this.paymentRepository.listByInvoice(invoiceId);
    const total = computeInvoiceTotal(invoice);
    const paid = payments.reduce(
      (sum, payment) => sum + toUnits(payment.amount),
      0n,
    );

    return {
      ...invoice,
      status: derivePaymentStatus(invoice.status, total, paid),
    };
  }

  async duplicateInvoice(
    businessId: string,
    invoiceId: string,
  ): Promise<Invoice> {
    const source = await this.findById(businessId, invoiceId);

    const copy: Invoice = {
      ...source,
      id: randomUUID(),
      number: `COPY-${source.number}`,
      status: 'draft',
      sentAt: undefined,
      items: source.items.map((item) => ({
        ...item,
        id: randomUUID(),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(copy);

    return copy;
  }

  async voidInvoice(businessId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.findById(businessId, invoiceId);

    if (invoice.status === 'draft') {
      throw new BadRequestException('Drafts should be deleted, not voided');
    }

    if (invoice.status === 'void') {
      return invoice;
    }

    const updated: Invoice = {
      ...invoice,
      status: 'void',
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(updated);
    await this.recordActivity(businessId, invoiceId, 'voided');

    return updated;
  }

  async deleteInvoice(businessId: string, invoiceId: string): Promise<void> {
    const invoice = await this.findById(businessId, invoiceId);

    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        'Only draft invoices can be deleted; sent invoices should be voided',
      );
    }

    await this.invoiceRepository.delete(invoiceId, businessId);
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
    await this.recordActivity(businessId, invoice.id, 'created');

    return invoice;
  }

  private async recordActivity(
    businessId: string,
    invoiceId: string,
    type: ActivityEvent['type'],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.activityEventRepository.record({
      id: randomUUID(),
      businessId,
      entityType: 'invoice',
      entityId: invoiceId,
      type,
      occurredAt: new Date().toISOString(),
      metadata,
    });
  }

  async listActivity(
    businessId: string,
    invoiceId: string,
  ): Promise<ActivityEvent[]> {
    await this.findById(businessId, invoiceId);
    const page = await this.activityEventRepository.list({
      businessId,
      entityType: 'invoice',
      entityId: invoiceId,
    });
    return [...page.items];
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

const MONEY_SCALE = 4n;
const SCALE_MULT = 10n ** MONEY_SCALE;

function toUnits(value: string): bigint {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const abs = negative ? trimmed.slice(1) : trimmed;
  const dot = abs.indexOf('.');
  const int = dot === -1 ? abs : abs.slice(0, dot);
  let frac = dot === -1 ? '' : abs.slice(dot + 1);
  frac = (frac + '0000').slice(0, Number(MONEY_SCALE));
  const units =
    BigInt(int === '' ? '0' : int) * SCALE_MULT +
    BigInt(frac === '' ? '0' : frac);
  return negative ? -units : units;
}

function multiply(units: bigint, factor: string): bigint {
  return (units * toUnits(factor)) / SCALE_MULT;
}

function percentOf(units: bigint, percent: string): bigint {
  return (units * toUnits(percent)) / (100n * SCALE_MULT);
}

function derivePaymentStatus(
  current: Invoice['status'],
  total: bigint,
  paid: bigint,
): Invoice['status'] {
  if (current === 'draft' || current === 'void') {
    return current;
  }
  if (paid >= total) {
    return 'paid';
  }
  if (paid > 0n) {
    return 'partially_paid';
  }
  return current;
}

function computeInvoiceTotal(invoice: Invoice): bigint {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + multiply(toUnits(item.quantity), item.rate),
    0n,
  );

  const discountAmount = invoice.discount
    ? invoice.discount.type === 'fixed'
      ? toUnits(invoice.discount.value)
      : percentOf(subtotal, invoice.discount.value)
    : 0n;

  const taxableSubtotal = subtotal - discountAmount;

  let taxTotal = 0n;
  invoice.items.forEach((item) => {
    const lineTotal = multiply(toUnits(item.quantity), item.rate);
    const discountedLineTotal =
      subtotal === 0n ? lineTotal : (lineTotal * taxableSubtotal) / subtotal;
    for (const tax of item.appliedTaxes ?? []) {
      taxTotal += percentOf(discountedLineTotal, tax.rate);
    }
  });

  return taxableSubtotal + taxTotal;
}
