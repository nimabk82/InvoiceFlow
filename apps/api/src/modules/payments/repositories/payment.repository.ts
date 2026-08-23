import type { InvoiceStatus, Payment } from '@invoiceflow/domain';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export type AtomicPaymentInput = {
  paymentId: string;
  invoiceId: string;
  businessId: string;
  amount: string;
  invoiceTotal: string;
  paidAt: string;
  method?: string;
  reference?: string;
  recordedAt: string;
};

export type AtomicPaymentResult = {
  status: InvoiceStatus;
  updatedAt: string;
};

export type PaymentRecordingFailure =
  | 'invoice_not_found'
  | 'ineligible_status'
  | 'overpayment';

export class PaymentRecordingError extends Error {
  constructor(readonly failure: PaymentRecordingFailure) {
    super(failure);
    this.name = 'PaymentRecordingError';
  }
}

export interface PaymentRepository {
  findById(id: string, invoiceId: string): Promise<Payment | null>;
  listByInvoice(invoiceId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  recordAtomically(input: AtomicPaymentInput): Promise<AtomicPaymentResult>;
}
