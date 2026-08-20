import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Payment } from '@invoiceflow/domain';

import { SUPABASE_CLIENT } from '../../../infrastructure/supabase/supabase-client.token';
import type { PaymentRepository } from './payment.repository';

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
    Functions: Record<string, never>;
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
