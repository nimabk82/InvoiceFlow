import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import type {
  EmailDeliveryResult,
  EmailMessage,
  EmailProvider,
} from './email-provider';

@Injectable()
export class DisabledEmailProvider implements EmailProvider {
  assertAvailable(): never {
    throw new ServiceUnavailableException(
      'Email delivery is disabled because no real provider is configured',
    );
  }

  send(message: EmailMessage): Promise<EmailDeliveryResult> {
    void message;
    return Promise.reject(
      new ServiceUnavailableException(
        'Email delivery is disabled because no real provider is configured',
      ),
    );
  }
}
