import { Inject, Injectable } from '@nestjs/common';

import type { EmailProvider } from './email-provider';
import { EMAIL_PROVIDER } from './email-provider';
import type { EmailDispatcher } from './email-dispatcher';
import type { EmailOutboxRepository } from './repositories/email-outbox.repository';
import { EMAIL_OUTBOX_REPOSITORY } from './repositories/email-outbox.repository';

@Injectable()
export class EmailDispatcherService implements EmailDispatcher {
  constructor(
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    @Inject(EMAIL_OUTBOX_REPOSITORY)
    private readonly outbox: EmailOutboxRepository,
    @Inject('EMAIL_PROVIDER_NAME') private readonly providerName: string,
  ) {}

  assertAvailable(): void {
    this.provider.assertAvailable?.();
  }

  async dispatch(outboxId: string): Promise<boolean> {
    return this.dispatchClaimable(outboxId);
  }

  async dispatchNext(): Promise<boolean> {
    return this.dispatchClaimable();
  }

  private async dispatchClaimable(outboxId?: string): Promise<boolean> {
    let claimed;

    try {
      claimed = await this.outbox.claim(outboxId);
    } catch {
      return false;
    }

    if (!claimed) {
      return false;
    }

    try {
      const result = await this.provider.send({
        idempotencyKey: claimed.commandKey,
        to: claimed.to,
        cc: claimed.cc,
        bcc: claimed.bcc,
        subject: claimed.subject,
        text: claimed.text,
      });

      if (!result.accepted) {
        await this.outbox.markFailed(
          claimed.id,
          claimed.claimToken,
          this.providerName,
          'Email provider did not accept the message',
        );
        return false;
      }

      return await this.outbox.markAccepted(
        claimed.id,
        claimed.claimToken,
        this.providerName,
        result.id,
      );
    } catch (error) {
      try {
        await this.outbox.markFailed(
          claimed.id,
          claimed.claimToken,
          this.providerName,
          error instanceof Error ? error.message : 'Email delivery failed',
        );
      } catch {
        // A processing lease is reclaimable if persisting the failure also fails.
      }
      return false;
    }
  }
}
