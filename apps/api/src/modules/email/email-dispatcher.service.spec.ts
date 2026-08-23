import type { EmailProvider } from './email-provider';
import { EmailDispatcherService } from './email-dispatcher.service';
import type { EmailOutboxRepository } from './repositories/email-outbox.repository';

function createDeps() {
  const send = jest
    .fn()
    .mockResolvedValue({ accepted: true, id: 'provider-1' });
  const provider = {
    assertAvailable: jest.fn(),
    send,
  } as unknown as EmailProvider;
  const claim = jest.fn().mockResolvedValue({
    id: 'outbox-1',
    commandKey: 'invoice:invoice-1:send',
    claimToken: 'claim-1',
    to: ['to@example.com'],
    cc: ['cc@example.com'],
    bcc: [],
    subject: 'Invoice',
    text: 'Please see attached.',
  });
  const markAccepted = jest.fn().mockResolvedValue(true);
  const markFailed = jest.fn().mockResolvedValue(true);
  const outbox = {
    claim,
    markAccepted,
    markFailed,
  } as unknown as EmailOutboxRepository;

  return { provider, outbox, send, claim, markAccepted, markFailed };
}

describe('EmailDispatcherService', () => {
  it('claims and marks an accepted provider delivery', async () => {
    const { provider, outbox, send, markAccepted } = createDeps();
    const dispatcher = new EmailDispatcherService(provider, outbox, 'logger');

    await expect(dispatcher.dispatch('outbox-1')).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith({
      idempotencyKey: 'invoice:invoice-1:send',
      to: ['to@example.com'],
      cc: ['cc@example.com'],
      bcc: [],
      subject: 'Invoice',
      text: 'Please see attached.',
    });
    expect(markAccepted).toHaveBeenCalledWith(
      'outbox-1',
      'claim-1',
      'logger',
      'provider-1',
    );
  });

  it('persists provider failure without throwing to the caller', async () => {
    const { provider, outbox, send, markFailed } = createDeps();
    send.mockRejectedValue(new Error('provider down'));
    const dispatcher = new EmailDispatcherService(provider, outbox, 'logger');

    await expect(dispatcher.dispatch('outbox-1')).resolves.toBe(false);
    expect(markFailed).toHaveBeenCalledWith(
      'outbox-1',
      'claim-1',
      'logger',
      'provider down',
    );
  });

  it('does not send when another worker owns the row', async () => {
    const { provider, outbox, send, claim } = createDeps();
    claim.mockResolvedValue(null);
    const dispatcher = new EmailDispatcherService(provider, outbox, 'logger');

    await expect(dispatcher.dispatch('outbox-1')).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('claims the next eligible row when dispatching without an id', async () => {
    const { provider, outbox, claim } = createDeps();
    const dispatcher = new EmailDispatcherService(provider, outbox, 'resend');

    await expect(dispatcher.dispatchNext()).resolves.toBe(true);
    expect(claim).toHaveBeenCalledWith(undefined);
  });
});
