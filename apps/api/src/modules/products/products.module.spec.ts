import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { validateEnvironment } from '../../config/environment';
import { PRODUCT_SERVICE_REPOSITORY } from './repositories/product-service.repository';
import { ProductsModule } from './products.module';
import { ProductsService } from './products.service';

describe('ProductsModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        ProductsModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the products service', () => {
    expect(module.get(ProductsService)).toBeInstanceOf(ProductsService);
  });

  it('provides the product service repository', () => {
    expect(module.get(PRODUCT_SERVICE_REPOSITORY)).toBeDefined();
  });
});
