import type { DatabaseAdapter, DatabaseMode, DatabaseTransaction } from './DatabaseAdapter';
import { isQuotaError, StorageError } from './StorageError';

export const VINYL_DB_NAME = 'vinyl-music';
export const VINYL_DB_VERSION = 1;
export const STORES = {
  collections: 'collections', tracks: 'tracks', trackSources: 'track_sources',
  rejectedSources: 'rejected_sources', playHistory: 'play_history',
  localAudioFiles: 'local_audio_files', providerCache: 'provider_cache', meta: 'meta',
} as const;

type Migration = (database: IDBDatabase) => void;
const migrations: Record<number, Migration> = {
  1: (database) => {
    const create = (name: string) => database.objectStoreNames.contains(name) ? null : database.createObjectStore(name);
    create(STORES.collections);
    const tracks = create(STORES.tracks); tracks?.createIndex('albumId', 'albumId');
    const sources = create(STORES.trackSources); sources?.createIndex('trackId', 'trackId'); sources?.createIndex('localAudioId', 'localAudioId');
    const rejected = create(STORES.rejectedSources); rejected?.createIndex('trackId', 'trackId');
    const history = create(STORES.playHistory); history?.createIndex('trackId', 'trackId'); history?.createIndex('playedAt', 'playedAt');
    create(STORES.localAudioFiles);
    const cache = create(STORES.providerCache); cache?.createIndex('expiresAt', 'expiresAt');
    create(STORES.meta);
  },
};

const result = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
});
const completed = (tx: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
});

export class WebIndexedDBAdapter implements DatabaseAdapter {
  public readonly version = VINYL_DB_VERSION;
  private databasePromise?: Promise<IDBDatabase>;

  public async initialize(): Promise<void> { await this.open(); }

  public async transaction<T>(stores: string[], mode: DatabaseMode, work: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const db = await this.open();
    const transaction = db.transaction(stores, mode);
    const adapter: DatabaseTransaction = {
      get: async <V>(store: string, key: IDBValidKey) => result(transaction.objectStore(store).get(key)) as Promise<V | undefined>,
      getAll: async <V>(store: string) => result(transaction.objectStore(store).getAll()) as Promise<V[]>,
      put: async <V>(store: string, key: IDBValidKey, value: V) => { await result(transaction.objectStore(store).put(value, key)); },
      delete: async (store: string, key: IDBValidKey) => { await result(transaction.objectStore(store).delete(key)); },
      clear: async (store: string) => { await result(transaction.objectStore(store).clear()); },
    };
    try {
      const value = await work(adapter);
      await completed(transaction);
      return value;
    } catch (error) {
      // IndexedDB has no standard readyState property. abort() is safe while
      // active and throws InvalidStateError after completion, which we ignore.
      try { transaction.abort(); } catch { /* transaction already settled */ }
      if (error instanceof StorageError) throw error;
      if (isQuotaError(error)) throw new StorageError('STORAGE_QUOTA_EXCEEDED', 'Browser storage quota was exceeded', error);
      throw new StorageError(mode === 'readwrite' ? 'STORAGE_WRITE_FAILED' : 'STORAGE_READ_FAILED', 'IndexedDB transaction failed', error);
    }
  }

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;
    if (typeof indexedDB === 'undefined') return Promise.reject(new StorageError('STORAGE_UNAVAILABLE', 'IndexedDB is unavailable'));
    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(VINYL_DB_NAME, VINYL_DB_VERSION);
      request.onupgradeneeded = (event) => {
        for (let version = event.oldVersion + 1; version <= VINYL_DB_VERSION; version += 1) migrations[version]?.(request.result);
      };
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => { this.databasePromise = undefined; reject(new StorageError('STORAGE_UNAVAILABLE', 'Unable to open IndexedDB', request.error)); };
      request.onblocked = () => { this.databasePromise = undefined; reject(new StorageError('STORAGE_UNAVAILABLE', 'IndexedDB upgrade is blocked by another tab')); };
    });
    return this.databasePromise;
  }
}

export const vinylDatabase = new WebIndexedDBAdapter();

type StoreName = typeof STORES[keyof typeof STORES];

export const idbGet = <T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> =>
  vinylDatabase.transaction([store], 'readonly', transaction => transaction.get<T>(store, key));

export const idbPut = <T>(store: StoreName, key: IDBValidKey, value: T): Promise<void> =>
  vinylDatabase.transaction([store], 'readwrite', transaction => transaction.put(store, key, value));
