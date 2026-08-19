import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { validateEnvironment } from '../../config/environment';
import { AuthGuard } from './auth.guard';
import { AUTHENTICATION } from './authentication';
import { AuthModule } from './auth.module';
import { SupabaseAuthentication } from './supabase-authentication';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        AuthModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the authentication adapter', () => {
    expect(module.get(AUTHENTICATION)).toBeInstanceOf(SupabaseAuthentication);
  });

  it('provides the auth guard', () => {
    expect(module.get(AuthGuard)).toBeInstanceOf(AuthGuard);
  });
});
