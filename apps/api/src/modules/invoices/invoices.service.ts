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
  calculateDocumentTotals,
  calculatePaidBalance,
  Money,
} from '@invoiceflow/calculations';
import { validateFinalDocumentForSend } from '@invoiceflow/validation';

import {
  BUSINESS_REPOSITORY,
  type BusinessRepository,
} from '../businesses/repositories/business.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository';
import {
  EMAIL_DISPATCHER,
  type EmailDispatcher,
} from '../email/email-dispatcher';
import {
  ACTIVITY_EVENT_REPOSITORY,
  type ActivityEventRepository,
} from '../audit/repositories/activity-event.repository';
import {
  ThemeAssignmentService,
  type ThemeAssignment,
} from '../theme-assignment/theme-assignment.service';
import {
  PAYMENT_REPOSITORY,
  PaymentRecordingError,
  type AtomicPaymentResult,
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
  sourceProductServiceId?: string;
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
  themeId?: string;
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
    @Inject(EMAIL_DISPATCHER)
    private readonly emailProvider: EmailDispatcher,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(ACTIVITY_EVENT_REPOSITORY)
    private readonly activityEventRepository: ActivityEventRepository,
    private readonly themeAssignment: ThemeAssignmentService,
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

    const validation = validateFinalDocumentForSend({
      clientSelected: Boolean(invoice.clientId),
      items: invoice.items,
      themeId: invoice.themeId,
      themeVersionId: invoice.themeVersionId,
      to,
      cc,
      bcc,
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.issues[0]?.message);
    }

    const subject =
      input.subject?.trim() ||
      `Invoice ${invoice.number} from ${invoice.businessSnapshot.displayName}`;

    this.emailProvider.assertAvailable();

    const sentAt = new Date().toISOString();
    const sent: Invoice = {
      ...invoice,
      status: 'sent',
      sentAt,
      updatedAt: sentAt,
    };

    const outboxId = await this.invoiceRepository.markSentAndEnqueue(
      invoiceId,
      businessId,
      sentAt,
      {
        commandKey: `invoice:${invoiceId}:send`,
        to,
        cc,
        bcc,
        subject,
        text: input.message,
      },
    );
    if (!outboxId) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    await this.emailProvider.dispatch(outboxId);

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
    if (typeof input.amount !== 'string' || input.amount.trim() === '') {
      throw new BadRequestException('Payment amount is required');
    }

    if (
      typeof input.paidAt !== 'string' ||
      input.paidAt.trim() === '' ||
      Number.isNaN(Date.parse(input.paidAt))
    ) {
      throw new BadRequestException('Payment date is required');
    }

    const invoice = await this.findById(businessId, invoiceId);

    if (
      !['sent', 'viewed', 'partially_paid', 'overdue'].includes(invoice.status)
    ) {
      throw new BadRequestException(
        'Payments can only be recorded for sent, viewed, partially paid, or overdue invoices',
      );
    }

    let amount: Money;
    try {
      amount = Money.fromDecimalString(input.amount, invoice.currencyCode);
    } catch {
      throw new BadRequestException('Enter a valid payment amount');
    }

    if (amount.isZero || amount.isNegative) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const total = calculateDocumentTotals({
      currencyCode: invoice.currencyCode,
      items: invoice.items,
      discount: invoice.discount,
      depositTerms: invoice.depositTerms,
    }).total;

    const paymentId = randomUUID();
    const recordedAt = new Date().toISOString();
    let result: AtomicPaymentResult;
    try {
      result = await this.paymentRepository.recordAtomically({
        paymentId,
        invoiceId,
        businessId,
        amount: amount.toDecimalString(),
        invoiceTotal: total.toDecimalString(),
        paidAt: input.paidAt,
        method: input.method,
        reference: input.reference,
        recordedAt,
      });
    } catch (error) {
      if (error instanceof PaymentRecordingError) {
        if (error.failure === 'invoice_not_found') {
          throw new NotFoundException('Invoice not found');
        }
        if (error.failure === 'overpayment') {
          throw new BadRequestException(
            'Payment amount exceeds invoice balance',
          );
        }
        throw new BadRequestException(
          'Payments can only be recorded for sent, viewed, partially paid, or overdue invoices',
        );
      }
      throw error;
    }

    const updated: Invoice = {
      ...invoice,
      status: result.status,
      updatedAt: result.updatedAt,
    };

    return { invoice: updated, paymentId };
  }

  async getInvoiceWithStatus(
    businessId: string,
    invoiceId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(businessId, invoiceId);
    const payments = await this.paymentRepository.listByInvoice(invoiceId);
    const total = calculateDocumentTotals({
      currencyCode: invoice.currencyCode,
      items: invoice.items,
      discount: invoice.discount,
      depositTerms: invoice.depositTerms,
    }).total;
    const { paid } = calculatePaidBalance(total, payments);

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

  async adoptLatestTheme(
    businessId: string,
    invoiceId: string,
  ): Promise<Invoice> {
    const invoice = await this.findById(businessId, invoiceId);

    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        'Only draft invoices can adopt a newer theme version',
      );
    }

    const assignment = await this.themeAssignment.resolveById(
      invoice.themeId,
      businessId,
    );

    if (!assignment) {
      throw new BadRequestException('Invoice has no theme to update');
    }

    const updated: Invoice = {
      ...invoice,
      themeId: assignment.themeId,
      themeVersionId: assignment.themeVersionId,
      themeNameSnapshot: assignment.themeName,
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(updated);

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

    if (input.clientId && !client) {
      throw new BadRequestException('Client not found for this business');
    }

    const assignment: ThemeAssignment | undefined =
      (await this.themeAssignment.resolveById(input.themeId, businessId)) ??
      (await this.themeAssignment.resolveDefault(businessId, 'invoice'));

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

  async updateInvoice(
    businessId: string,
    invoiceId: string,
    input: CreateInvoiceInput,
  ): Promise<Invoice> {
    const existing = await this.findById(businessId, invoiceId);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be edited');
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
      (await this.themeAssignment.resolveDefault(businessId, 'invoice'));

    const updated: Invoice = {
      ...existing,
      number: input.number?.trim() || existing.number,
      clientId: input.clientId,
      clientSnapshot: client
        ? toClientSnapshot(client)
        : existing.clientSnapshot,
      currencyCode,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
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
      poNumber: input.poNumber,
      discount: input.discount,
      depositTerms: input.depositTerms,
      updatedAt: new Date().toISOString(),
    };

    await this.invoiceRepository.save(updated);

    return updated;
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

function derivePaymentStatus(
  current: Invoice['status'],
  total: Money,
  paid: Money,
): Invoice['status'] {
  if (current === 'draft' || current === 'void') {
    return current;
  }
  if (paid.compare(total) >= 0) {
    return 'paid';
  }
  if (!paid.isZero) {
    return 'partially_paid';
  }
  return current;
}
