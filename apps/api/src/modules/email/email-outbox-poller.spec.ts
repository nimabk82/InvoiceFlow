import type { EmailDispatcher } from './email-dispatcher';
import { EmailOutboxPoller } from './email-outbox-poller';

describe('EmailOutboxPoller', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('unrefs its timer and stops polling on shutdown', async () => {
    const unref = jest.fn();
    const timer = { unref } as unknown as NodeJS.Timeout;
    const setIntervalMock = jest
      .spyOn(global, 'setInterval')
      .mockReturnValue(timer);
    const clearIntervalMock = jest.spyOn(global, 'clearInterval');
    const dispatchNext = jest.fn().mockResolvedValue(false);
    const worker = new EmailOutboxPoller(
      { dispatchNext } as unknown as EmailDispatcher,
      1_000,
    );

    worker.onApplicationBootstrap();
    expect(unref).toHaveBeenCalledTimes(1);

    const tick = setIntervalMock.mock.calls[0]?.[0];
    if (typeof tick === 'function') {
      tick();
    }
    await Promise.resolve();
    expect(dispatchNext).toHaveBeenCalledTimes(1);

    await worker.onApplicationShutdown();
    expect(clearIntervalMock).toHaveBeenCalledWith(timer);
  });

  it('does not overlap polls and waits for the active poll on shutdown', async () => {
    let resolveDispatch: ((value: boolean) => void) | undefined;
    const dispatchNext = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDispatch = resolve;
        }),
    );
    const worker = new EmailOutboxPoller(
      { dispatchNext } as unknown as EmailDispatcher,
      1_000,
    );

    worker.poll();
    worker.poll();
    expect(dispatchNext).toHaveBeenCalledTimes(1);

    const shutdown = worker.onApplicationShutdown();
    let shutdownComplete = false;
    void shutdown.then(() => {
      shutdownComplete = true;
    });
    await Promise.resolve();
    expect(shutdownComplete).toBe(false);

    resolveDispatch?.(true);
    await shutdown;
    expect(shutdownComplete).toBe(true);
  });
});
