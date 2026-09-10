import type { StorageService } from './StorageService';

export class WebStorageAdapter implements StorageService {
  public getItem(key: string): string | null { return window.localStorage.getItem(key); }
  public setItem(key: string, value: string): void { window.localStorage.setItem(key, value); }
  public removeItem(key: string): void { window.localStorage.removeItem(key); }
}
