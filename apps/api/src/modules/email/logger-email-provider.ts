import { Injectable, Logger } from '@nestjs/common';

import type {
  EmailDeliveryResult,
  EmailMessage,
  EmailProvider,
} from './email-provider';

@Injectable()
export class LoggerEmailProvider implements EmailProvider {
  private readonly logger = new Logger('EmailProvider');

  send(message: EmailMessage): Promise<EmailDeliveryResult> {
    this.logger.log({
      event: 'email_send_simulated',
      recipientCount: Array.isArray(message.to) ? message.to.length : 1,
      hasHtml: message.html !== undefined,
      hasText: message.text !== undefined,
    });
    return Promise.resolve({ accepted: true });
  }
}
