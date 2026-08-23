import { PaymentRecordingError } from './payment.repository';
import { SupabasePaymentRepository } from './supabase-payment.repository';

type RepositoryClient = ConstructorParameters<
  typeof SupabasePaymentRepository
>[0];

function createClient(result: unknown): RepositoryClient {
  return {
    rpc: jest.fn().mockResolvedValue(result),
  } as unknown as RepositoryClient;
}

const input = {
  paymentId: 'payment-1',
  invoiceId: 'invoice-1',
  businessId: 'business-1',
  amount: '25.00',
  invoiceTotal: '100.00',
  paidAt: '2026-08-22T00:00:00.000Z',
  method: 'bank_transfer',
  reference: 'REF-1',
  recordedAt: '2026-08-22T01:00:00.000Z',
};

describe('SupabasePaymentRepository', () => {
  it('records a payment through the atomic RPC and maps its result', async () => {
    const client = createClient({
      data: [
        {
          status: 'partially_paid',
          updated_at: '2026-08-22T01:00:00.000Z',
        },
      ],
      error: null,
    });
    const repository = new SupabasePaymentRepository(client);

    await expect(repository.recordAtomically(input)).resolves.toEqual({
      status: 'partially_paid',
      updatedAt: '2026-08-22T01:00:00.000Z',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.rpc).toHaveBeenCalledWith('record_invoice_payment', {
      p_payment_id: 'payment-1',
      p_invoice_id: 'invoice-1',
      p_business_id: 'business-1',
      p_amount: '25.00',
      p_invoice_total: '100.00',
      p_paid_at: '2026-08-22T00:00:00.000Z',
      p_method: 'bank_transfer',
      p_reference: 'REF-1',
      p_recorded_at: '2026-08-22T01:00:00.000Z',
    });
  });

  it('maps a concurrent overpayment rejection to a repository error', async () => {
    const client = createClient({
      data: null,
      error: { message: 'Payment amount exceeds invoice balance' },
    });
    const repository = new SupabasePaymentRepository(client);

    await expect(repository.recordAtomically(input)).rejects.toEqual(
      new PaymentRecordingError('overpayment'),
    );
  });
});
