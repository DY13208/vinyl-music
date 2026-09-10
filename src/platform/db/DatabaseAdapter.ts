export type DatabaseMode = 'readonly' | 'readwrite';

export interface DatabaseTransaction {
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined>;
  getAll<T>(store: string): Promise<T[]>;
  put<T>(store: string, key: IDBValidKey, value: T): Promise<void>;
  delete(store: string, key: IDBValidKey): Promise<void>;
  clear(store: string): Promise<void>;
}

/** Repository-facing contract; only the Web adapter depends on IndexedDB. */
export interface DatabaseAdapter {
  readonly version: number;
  initialize(): Promise<void>;
  transaction<T>(stores: string[], mode: DatabaseMode, work: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
}
