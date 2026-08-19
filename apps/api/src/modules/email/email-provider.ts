export type EmailMessage = Readonly<{
  to: string | readonly string[];
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
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
}
