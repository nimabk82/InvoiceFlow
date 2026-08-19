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
    this.logger.log({ event: 'email_send', message });
    return Promise.resolve({ accepted: true });
  }
}
