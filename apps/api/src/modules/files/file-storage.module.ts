import { Module } from '@nestjs/common';

import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { FILE_STORAGE } from './file-storage';
import { SupabaseFileStorage } from './supabase-file-storage';

@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: FILE_STORAGE,
      useClass: SupabaseFileStorage,
    },
  ],
  exports: [FILE_STORAGE],
})
export class FileStorageModule {}
