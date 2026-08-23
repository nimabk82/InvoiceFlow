import { ServiceUnavailableException } from '@nestjs/common';

import { DisabledEmailProvider } from './disabled-email-provider';

describe('DisabledEmailProvider', () => {
  it('fails closed instead of reporting a successful delivery', async () => {
    const provider = new DisabledEmailProvider();

    await expect(
      provider.send({ to: 'client@example.com', subject: 'Invoice' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
