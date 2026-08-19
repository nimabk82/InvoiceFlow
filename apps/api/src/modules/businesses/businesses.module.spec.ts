import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { validateEnvironment } from '../../config/environment';
import { BusinessesModule } from './businesses.module';
import { BusinessesService } from './businesses.service';
import { BUSINESS_REPOSITORY } from './repositories/business.repository';

describe('BusinessesModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        BusinessesModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the businesses service', () => {
    expect(module.get(BusinessesService)).toBeInstanceOf(BusinessesService);
  });

  it('provides the business repository', () => {
    expect(module.get(BUSINESS_REPOSITORY)).toBeDefined();
  });
});
