import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Payment } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import {
  PaymentRecordingError,
  type AtomicPaymentInput,
  type AtomicPaymentResult,
  type PaymentRepository,
} from './payment.repository';

type PaymentRow = {
  id: string;
  invoice_id: string;
  amount: string;
  paid_at: string;
  method: string | null;
  reference: string | null;
  created_at?: string;
};

type Database = {
  public: {
    Tables: {
      payments: {
        Row: PaymentRow;
        Insert: PaymentRow;
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_invoice_payment: {
        Args: {
          p_payment_id: string;
          p_invoice_id: string;
          p_business_id: string;
          p_amount: string;
          p_invoice_total: string;
          p_paid_at: string;
          p_method: string | null;
          p_reference: string | null;
          p_recorded_at: string;
        };
        Returns: {
          status: AtomicPaymentResult['status'];
          updated_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

@Injectable()
export class SupabasePaymentRepository implements PaymentRepository {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient<Database>,
  ) {}

  async findById(id: string, invoiceId: string): Promise<Payment | null> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('invoice_id', invoiceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data) : null;
  }

  async listByInvoice(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(mapRow);
  }

  async save(payment: Payment): Promise<void> {
    const { error } = await this.client.from('payments').insert({
      id: payment.id,
      invoice_id: payment.invoiceId,
      amount: payment.amount,
      paid_at: payment.paidAt,
      method: payment.method ?? null,
      reference: payment.reference ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async recordAtomically(
    input: AtomicPaymentInput,
  ): Promise<AtomicPaymentResult> {
    const { data, error } = await this.client.rpc('record_invoice_payment', {
      p_payment_id: input.paymentId,
      p_invoice_id: input.invoiceId,
      p_business_id: input.businessId,
      p_amount: input.amount,
      p_invoice_total: input.invoiceTotal,
      p_paid_at: input.paidAt,
      p_method: input.method ?? null,
      p_reference: input.reference ?? null,
      p_recorded_at: input.recordedAt,
    });

    if (error) {
      if (error.message.includes('Invoice not found')) {
        throw new PaymentRecordingError('invoice_not_found');
      }
      if (
        error.message.includes('Invoice status is not eligible for payment')
      ) {
        throw new PaymentRecordingError('ineligible_status');
      }
      if (error.message.includes('Payment amount exceeds invoice balance')) {
        throw new PaymentRecordingError('overpayment');
      }
      throw new Error(error.message);
    }

    const result = data?.[0];
    if (!result) {
      throw new Error('Atomic payment recording returned no result');
    }

    return { status: result.status, updatedAt: result.updated_at };
  }
}

function mapRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amount: String(row.amount),
    paidAt: row.paid_at,
    method: row.method ?? undefined,
    reference: row.reference ?? undefined,
  };
}
