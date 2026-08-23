import type { EmailMessage } from './email-provider';
import { LoggerEmailProvider } from './logger-email-provider';
import { Logger } from '@nestjs/common';

describe('LoggerEmailProvider', () => {
  it('accepts a message', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const provider = new LoggerEmailProvider();
    const message: EmailMessage = {
      to: 'client@example.com',
      subject: 'Invoice',
      text: 'Hello',
    };

    await expect(provider.send(message)).resolves.toEqual({ accepted: true });
    expect(log).toHaveBeenCalledWith({
      event: 'email_send_simulated',
      recipientCount: 1,
      hasHtml: false,
      hasText: true,
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('client@example.com');
    expect(JSON.stringify(log.mock.calls)).not.toContain('Invoice');
    expect(JSON.stringify(log.mock.calls)).not.toContain('Hello');
  });
});
