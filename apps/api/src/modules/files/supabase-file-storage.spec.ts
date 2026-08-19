import type { SupabaseClient } from '@supabase/supabase-js';

import { FileStorageError } from './file-storage';
import { SupabaseFileStorage } from './supabase-file-storage';

function createStorageClient() {
  const upload = jest.fn();
  const getPublicUrl = jest.fn();
  const remove = jest.fn();
  const from = jest.fn(() => ({ upload, getPublicUrl, remove }));

  return {
    client: { storage: { from } } as unknown as SupabaseClient,
    upload,
    getPublicUrl,
    remove,
  };
}

describe('SupabaseFileStorage', () => {
  it('uploads a file and returns the stored file', async () => {
    const { client, upload, getPublicUrl } = createStorageClient();
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.test/file.png' },
    });
    const storage = new SupabaseFileStorage(client);

    const result = await storage.upload({
      bucket: 'logos',
      path: 'acme/logo.png',
      data: new Uint8Array([1, 2, 3]),
      contentType: 'image/png',
    });

    expect(result).toEqual({
      id: 'acme/logo.png',
      url: 'https://cdn.example.test/file.png',
      bucket: 'logos',
    });
    expect(upload).toHaveBeenCalledWith(
      'acme/logo.png',
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/png', upsert: false },
    );
  });

  it('throws a FileStorageError when upload fails', async () => {
    const { client, upload } = createStorageClient();
    upload.mockResolvedValue({ error: new Error('denied') });
    const storage = new SupabaseFileStorage(client);

    await expect(
      storage.upload({
        bucket: 'logos',
        path: 'acme/logo.png',
        data: new Uint8Array([1]),
        contentType: 'image/png',
      }),
    ).rejects.toBeInstanceOf(FileStorageError);
  });

  it('deletes a file', async () => {
    const { client, remove } = createStorageClient();
    remove.mockResolvedValue({ error: null });
    const storage = new SupabaseFileStorage(client);

    await expect(
      storage.delete({ bucket: 'logos', fileId: 'acme/logo.png' }),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(['acme/logo.png']);
  });

  it('throws a FileStorageError when delete fails', async () => {
    const { client, remove } = createStorageClient();
    remove.mockResolvedValue({ error: new Error('not found') });
    const storage = new SupabaseFileStorage(client);

    await expect(
      storage.delete({ bucket: 'logos', fileId: 'acme/logo.png' }),
    ).rejects.toBeInstanceOf(FileStorageError);
  });
});
