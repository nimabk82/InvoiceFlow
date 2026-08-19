import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { validateEnvironment } from '../../config/environment';
import { ClientsModule } from './clients.module';
import { ClientsService } from './clients.service';
import { CLIENT_REPOSITORY } from './repositories/client.repository';

describe('ClientsModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        ClientsModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the clients service', () => {
    expect(module.get(ClientsService)).toBeInstanceOf(ClientsService);
  });

  it('provides the client repository', () => {
    expect(module.get(CLIENT_REPOSITORY)).toBeDefined();
  });
});
