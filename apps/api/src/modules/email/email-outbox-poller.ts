import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';

import type { EmailDispatcher } from './email-dispatcher';
import { EMAIL_DISPATCHER } from './email-dispatcher';

export const EMAIL_OUTBOX_POLL_INTERVAL_MS = Symbol(
  'EMAIL_OUTBOX_POLL_INTERVAL_MS',
);

@Injectable()
export class EmailOutboxPoller
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(EmailOutboxPoller.name);
  private timer?: NodeJS.Timeout;
  private activePoll?: Promise<void>;

  constructor(
    @Inject(EMAIL_DISPATCHER) private readonly dispatcher: EmailDispatcher,
    @Inject(EMAIL_OUTBOX_POLL_INTERVAL_MS) private readonly intervalMs: number,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => this.poll(), this.intervalMs);
    this.timer.unref();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    await this.activePoll;
  }

  poll(): void {
    if (this.activePoll || !this.dispatcher.dispatchNext) {
      return;
    }

    this.activePoll = this.dispatcher
      .dispatchNext()
      .then(() => undefined)
      .catch((error: unknown) => {
        this.logger.error(
          error instanceof Error ? error.message : 'Email outbox poll failed',
        );
      })
      .finally(() => {
        this.activePoll = undefined;
      });
  }
}
