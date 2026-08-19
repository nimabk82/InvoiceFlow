import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { validateEnvironment } from '../../config/environment';
import { FILE_STORAGE } from './file-storage';
import { FileStorageModule } from './file-storage.module';
import { SupabaseFileStorage } from './supabase-file-storage';

describe('FileStorageModule', () => {
  let module: TestingModule;

  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ validate: validateEnvironment }),
        FileStorageModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides the file storage adapter', () => {
    expect(module.get(FILE_STORAGE)).toBeInstanceOf(SupabaseFileStorage);
  });
});
