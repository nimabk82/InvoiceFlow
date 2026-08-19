import type { Payment } from '@invoiceflow/domain';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface PaymentRepository {
  findById(id: string, invoiceId: string): Promise<Payment | null>;
  listByInvoice(invoiceId: string): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
}
