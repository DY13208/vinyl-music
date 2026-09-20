import { StorageError } from './StorageError';
import type { StorageQuotaAdapter } from './StorageQuotaAdapter';

const MINIMUM_RESERVE_BYTES = 5 * 1024 * 1024;

/** Keeps navigator.storage entirely inside the Web platform layer. */
export class WebStorageQuotaAdapter implements StorageQuotaAdapter {
  public async ensureAvailable(additionalBytes: number): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;
    let estimate: StorageEstimate;
    try {
      estimate = await navigator.storage.estimate();
    } catch (error) {
      throw new StorageError('STORAGE_UNAVAILABLE', 'Unable to estimate browser storage capacity', error);
    }
    if (estimate.quota === undefined || estimate.usage === undefined) return;
    if (estimate.quota - estimate.usage < additionalBytes + MINIMUM_RESERVE_BYTES) {
      throw new StorageError('STORAGE_QUOTA_EXCEEDED', 'Browser storage quota is insufficient for this audio file');
    }
  }
}
