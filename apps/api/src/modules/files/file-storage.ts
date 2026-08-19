export type UploadFileInput = Readonly<{
  bucket: string;
  path: string;
  data: ArrayBuffer | Uint8Array | Blob;
  contentType: string;
}>;

export type StoredFile = Readonly<{
  id: string;
  url: string;
  bucket: string;
}>;

export type DeleteFileInput = Readonly<{
  bucket: string;
  fileId: string;
}>;

export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface FileStorage {
  upload(input: UploadFileInput): Promise<StoredFile>;
  delete(input: DeleteFileInput): Promise<void>;
}

export class FileStorageError extends Error {}
