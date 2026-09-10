import type { LocalAudioStore } from './LocalAudioStore';

const DB_NAME = 'vinyl-music-local-audio';
const STORE_NAME = 'audio-files';

export class WebIndexedDbAudioStore implements LocalAudioStore {
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async put(id: string, blob: Blob): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(blob, id);
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
    });
    db.close();
  }

  public async getPlaybackUri(id: string): Promise<string | null> {
    const db = await this.open();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as Blob | undefined); request.onerror = () => reject(request.error);
    });
    db.close();
    return blob ? URL.createObjectURL(blob) : null;
  }

  public async remove(id: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
    });
    db.close();
  }
}
