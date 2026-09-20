import type { StorageService } from './StorageService';
import { accountStorageName } from './accountScope';

export class WebStorageAdapter implements StorageService {
  public getItem(key: string): string | null { return window.localStorage.getItem(accountStorageName(key)); }
  public setItem(key: string, value: string): void { window.localStorage.setItem(accountStorageName(key), value); }
  public removeItem(key: string): void { window.localStorage.removeItem(accountStorageName(key)); }
}
