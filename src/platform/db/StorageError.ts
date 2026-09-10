export type StorageErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'STORAGE_MIGRATION_FAILED'
  | 'STORAGE_READ_FAILED'
  | 'STORAGE_WRITE_FAILED'
  | 'STORAGE_DELETE_FAILED';

export class StorageError extends Error {
  public constructor(public readonly code: StorageErrorCode, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
