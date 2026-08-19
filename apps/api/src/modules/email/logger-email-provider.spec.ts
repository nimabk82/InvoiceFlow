import type { EmailMessage } from './email-provider';
import { LoggerEmailProvider } from './logger-email-provider';

describe('LoggerEmailProvider', () => {
  it('accepts a message', async () => {
    const provider = new LoggerEmailProvider();
    const message: EmailMessage = {
      to: 'client@example.com',
      subject: 'Invoice',
      text: 'Hello',
    };

    await expect(provider.send(message)).resolves.toEqual({ accepted: true });
  });
});
