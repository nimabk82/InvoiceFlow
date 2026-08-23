export type EmailMessage = Readonly<{
  idempotencyKey?: string;
  to: string | readonly string[];
  cc?: readonly string[];
  bcc?: readonly string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}>;

export type EmailDeliveryResult = Readonly<{
  accepted: boolean;
  id?: string;
}>;

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export interface EmailProvider {
  assertAvailable?(): void;
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}
