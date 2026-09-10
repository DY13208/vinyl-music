export interface StorageQuotaAdapter {
  ensureAvailable(additionalBytes: number): Promise<void>;
}
