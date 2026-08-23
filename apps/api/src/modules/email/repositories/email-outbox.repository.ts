export const EMAIL_OUTBOX_REPOSITORY = Symbol('EMAIL_OUTBOX_REPOSITORY');

export type DocumentEmail = Readonly<{
  commandKey: string;
  to: readonly string[];
  cc: readonly string[];
  bcc: readonly string[];
  subject: string;
  text?: string;
}>;

export type ClaimedEmail = Readonly<{
  id: string;
  commandKey: string;
  claimToken: string;
  to: readonly string[];
  cc: readonly string[];
  bcc: readonly string[];
  subject: string;
  text?: string;
}>;

export interface EmailOutboxRepository {
  claim(outboxId?: string): Promise<ClaimedEmail | null>;
  markAccepted(
    outboxId: string,
    claimToken: string,
    providerName: string,
    providerMessageId?: string,
  ): Promise<boolean>;
  markFailed(
    outboxId: string,
    claimToken: string,
    providerName: string,
    error: string,
  ): Promise<boolean>;
}
