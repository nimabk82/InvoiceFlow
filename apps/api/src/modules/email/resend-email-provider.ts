import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EnvironmentVariables } from '../../config/environment';
import type {
  EmailDeliveryResult,
  EmailMessage,
  EmailProvider,
} from './email-provider';

export const RESEND_FETCH = Symbol('RESEND_FETCH');
export type ResendFetch = typeof fetch;

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    @Inject(RESEND_FETCH) private readonly fetcher: ResendFetch,
  ) {}

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const response = await this.fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('RESEND_API_KEY', { infer: true })}`,
        'Content-Type': 'application/json',
        ...(message.idempotencyKey
          ? { 'Idempotency-Key': message.idempotencyKey }
          : {}),
      },
      body: JSON.stringify({
        from: message.from ?? this.config.get('EMAIL_FROM', { infer: true }),
        to: typeof message.to === 'string' ? [message.to] : message.to,
        cc: message.cc && message.cc.length > 0 ? message.cc : undefined,
        bcc: message.bcc && message.bcc.length > 0 ? message.bcc : undefined,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend rejected email with status ${response.status}`);
    }

    const result: unknown = await response.json();
    return {
      accepted: true,
      id:
        typeof result === 'object' &&
        result !== null &&
        'id' in result &&
        typeof result.id === 'string'
          ? result.id
          : undefined,
    };
  }
}
