import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { validateEnvironment } from '../../config/environment';
import { INVOICE_REPOSITORY } from './repositories/invoice.repository';
import { InvoicesModule } from './invoices.module';
import { InvoicesService } from './invoices.service';

describe('InvoicesModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        InvoicesModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the invoices service', () => {
    expect(module.get(InvoicesService)).toBeInstanceOf(InvoicesService);
  });

  it('provides the invoice repository', () => {
    expect(module.get(INVOICE_REPOSITORY)).toBeDefined();
  });
});
