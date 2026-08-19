import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';

import { validateEnvironment } from '../../config/environment';
import { SUPABASE_CLIENT } from './supabase-client.token';
import { SupabaseModule } from './supabase.module';

describe('SupabaseModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        SupabaseModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides an injectable SupabaseClient', () => {
    const client = module.get<SupabaseClient>(SUPABASE_CLIENT);

    expect(client).toBeInstanceOf(SupabaseClient);
  });

  it('provides a single shared client instance', () => {
    const first = module.get<SupabaseClient>(SUPABASE_CLIENT);
    const second = module.get<SupabaseClient>(SUPABASE_CLIENT);

    expect(first).toBe(second);
  });
});
