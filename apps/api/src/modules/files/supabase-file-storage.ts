import { Inject, Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../../infrastructure/supabase/supabase-client.token';
import {
  FileStorageError,
  type DeleteFileInput,
  type FileStorage,
  type StoredFile,
  type UploadFileInput,
} from './file-storage';

@Injectable()
export class SupabaseFileStorage implements FileStorage {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly client: SupabaseClient,
  ) {}

  async upload(input: UploadFileInput): Promise<StoredFile> {
    const bucket = this.client.storage.from(input.bucket);
    const { error } = await bucket.upload(input.path, input.data, {
      contentType: input.contentType,
      upsert: false,
    });

    if (error) {
      throw new FileStorageError(error.message);
    }

    const { data } = bucket.getPublicUrl(input.path);

    return {
      id: input.path,
      url: data.publicUrl,
      bucket: input.bucket,
    };
  }

  async delete(input: DeleteFileInput): Promise<void> {
    const { error } = await this.client.storage
      .from(input.bucket)
      .remove([input.fileId]);

    if (error) {
      throw new FileStorageError(error.message);
    }
  }
}
