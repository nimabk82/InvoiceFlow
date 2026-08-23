import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../config/environment';
import type { ResendFetch } from './resend-email-provider';
import { ResendEmailProvider } from './resend-email-provider';

describe('ResendEmailProvider', () => {
  it('sends through the Resend HTTP API with an idempotency key', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: 'email-1' }),
    }) as unknown as jest.MockedFunction<ResendFetch>;
    const provider = new ResendEmailProvider(createConfig(), fetcher);

    await expect(
      provider.send({
        idempotencyKey: 'invoice:invoice-1:send',
        to: ['client@example.com'],
        cc: ['accounts@example.com'],
        subject: 'Invoice 001',
        text: 'Your invoice is ready.',
      }),
    ).resolves.toEqual({ accepted: true, id: 'email-1' });

    expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer re_test',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'invoice:invoice-1:send',
      },
      body: JSON.stringify({
        from: 'InvoiceFlow <billing@example.com>',
        to: ['client@example.com'],
        cc: ['accounts@example.com'],
        subject: 'Invoice 001',
        text: 'Your invoice is ready.',
      }),
    });
  });

  it('rejects non-successful Resend responses', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }) as unknown as jest.MockedFunction<ResendFetch>;
    const provider = new ResendEmailProvider(createConfig(), fetcher);

    await expect(
      provider.send({ to: 'client@example.com', subject: 'Invoice' }),
    ).rejects.toThrow('Resend rejected email with status 429');
  });
});

function createConfig(): ConfigService<EnvironmentVariables, true> {
  return new ConfigService<EnvironmentVariables, true>({
    EMAIL_FROM: 'InvoiceFlow <billing@example.com>',
    RESEND_API_KEY: 're_test',
  });
}
