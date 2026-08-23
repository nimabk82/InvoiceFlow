import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from '../../config/environment';
import { DisabledEmailProvider } from './disabled-email-provider';
import { EMAIL_PROVIDER } from './email-provider';
import { EmailModule } from './email.module';
import { LoggerEmailProvider } from './logger-email-provider';

describe('EmailModule', () => {
  it('provides the logger adapter when configured', async () => {
    const module = await compileModule('logger');
    expect(module.get(EMAIL_PROVIDER)).toBeInstanceOf(LoggerEmailProvider);
    await module.close();
  });

  it('provides the fail-closed adapter when configured', async () => {
    const module = await compileModule('disabled');
    expect(module.get(EMAIL_PROVIDER)).toBeInstanceOf(DisabledEmailProvider);
    await module.close();
  });
});

function compileModule(emailProvider: 'logger' | 'disabled') {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        ignoreEnvFile: true,
        load: [() => ({ EMAIL_PROVIDER: emailProvider })],
        validate: (values) =>
          validateEnvironment({
            ...values,
            EMAIL_PROVIDER: emailProvider,
            NODE_ENV: 'test',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
            SUPABASE_URL: 'https://test.supabase.co',
          }),
      }),
      EmailModule,
    ],
  }).compile();
}
