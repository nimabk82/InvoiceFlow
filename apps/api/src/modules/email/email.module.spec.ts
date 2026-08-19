import { Test, type TestingModule } from '@nestjs/testing';

import { EMAIL_PROVIDER } from './email-provider';
import { EmailModule } from './email.module';
import { LoggerEmailProvider } from './logger-email-provider';

describe('EmailModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the email provider adapter', () => {
    expect(module.get(EMAIL_PROVIDER)).toBeInstanceOf(LoggerEmailProvider);
  });
});
