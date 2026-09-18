import type { Album } from '../types';
import type { VinylSearchResponse } from './collectionApi';
import type { DatabaseAdapter } from '../platform/db/DatabaseAdapter';
import { vinylDatabase } from '../platform/db/VinylDatabase';

type Content = { search: VinylSearchResponse['results']; album: Album };
type Entry<T> = { data: T; savedAt: number; expiresAt: number; bytes: number };
const KEY = 'public-catalogue-v1';
const FRESH_MS = 24 * 60 * 60 * 1000;
const RETAIN_MS = 7 * FRESH_MS;
const MAX_BYTES = 4 * 1024 * 1024;

/** Public catalogue snapshots in the account's local DB; never collection records or audio URLs. */
export class CatalogueCache {
  constructor(private db: DatabaseAdapter = vinylDatabase, private now = Date.now) {}

  async get<K extends keyof Content>(kind: K, id: string): Promise<{ data: Content[K]; stale: boolean } | undefined> {
    try {
      const entries = await this.db.transaction(['provider_cache'], 'readonly', tx =>
        tx.get<Record<string, Entry<Content[K]>>>('provider_cache', KEY));
      const entry = entries?.[JSON.stringify([kind, id])];
      if (!entry || entry.expiresAt <= this.now()) return;
      return { data: entry.data, stale: entry.savedAt + FRESH_MS <= this.now() };
    } catch { return; } // Browsing remains available when local storage is unavailable.
  }

  async put<K extends keyof Content>(kind: K, id: string, data: Content[K]): Promise<void> {
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
      if (bytes > MAX_BYTES) return;
      await this.db.transaction(['provider_cache'], 'readwrite', async tx => {
        const entries = await tx.get<Record<string, Entry<unknown>>>('provider_cache', KEY) || {};
        const key = JSON.stringify([kind, id]);
        const now = this.now();
        entries[key] = { data, savedAt: now, expiresAt: now + RETAIN_MS, bytes };
        const kept = Object.entries(entries).filter(([, entry]) => entry.expiresAt > now)
          .sort((a, b) => b[1].savedAt - a[1].savedAt);
        let total = 0;
        await tx.put('provider_cache', KEY, Object.fromEntries(kept.filter(([, entry], index) => {
          total += entry.bytes;
          return index < 40 && total <= MAX_BYTES;
        })));
      });
    } catch { /* Cache writes must never prevent displaying search results. */ }
  }
}

export const catalogueCache = new CatalogueCache();
