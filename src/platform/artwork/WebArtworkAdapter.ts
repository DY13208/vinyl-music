import { vinylDatabase } from '../db/VinylDatabase';
import { ArtworkCache, ARTWORK_ITEM_LIMIT, albumArtworkSources } from './ArtworkCache';
import { artworkKey, artworkRequestUrl, publicArtworkUrl, isDomesticArtwork } from '../../utils/artworkUrl';
import type { Album } from '../../types';

export type ResolvedArtwork = { url: string; local: boolean; release: () => void };
const MAX_DOWNLOAD_BYTES = 3 * 1024 * 1024;

export class WebArtworkAdapter {
  private cache = new ArtworkCache(vinylDatabase);
  private pending = new Map<string, Promise<Blob>>();
  private memory = new Map<string, Blob>();
  private memoryBytes = 0;
  private urls = new Map<string, { url: string; users: number }>();
  private failedUntil = new Map<string, number>();
  private active = 0;
  private waiting: Array<() => void> = [];

  async resolve(source: string): Promise<ResolvedArtwork> {
    const key = artworkKey(source);
    if (!key || /^(data:|blob:|\/(?!\/))/.test(key)) return { url: key, local: true, release() {} };
    try {
      const blob = await this.load(key);
      let shared = this.urls.get(key);
      if (!shared) { shared = { url: URL.createObjectURL(blob), users: 0 }; this.urls.set(key, shared); }
      shared.users++;
      let released = false;
      return { url: shared.url, local: true, release: () => {
        if (released) return;
        released = true;
        if (--shared.users === 0) { URL.revokeObjectURL(shared.url); this.urls.delete(key); }
      } };
    } catch {
      // A direct image can still display when CORS/storage is unavailable.
      return { url: key, local: false, release() {} };
    }
  }

  async prefetchCollection(albums: Album[]) {
    const queue = albumArtworkSources(albums).filter(source => /^https?:|^\/\//.test(source));
    // One background worker leaves download slots available to on-screen covers.
    for (const source of queue) { const artwork = await this.resolve(source); artwork.release(); }
  }

  stats() { return this.cache.stats(); }
  async clearBrowsing() { this.memory.clear(); this.memoryBytes = 0; await this.cache.clearBrowsing(); }
  onOnline(retry: () => void) {
    const listener = () => { this.failedUntil.clear(); retry(); };
    window.addEventListener('online', listener);
    return () => window.removeEventListener('online', listener);
  }

  async importFile(file: Blob): Promise<string> {
    if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type) || file.size > 20 * 1024 * 1024) throw new Error('请选择 20 MB 以内的 JPG、PNG 或 WEBP 图片');
    const blob = await this.compress(file);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('封面读取失败'));
      reader.readAsDataURL(blob);
    });
  }

  private load(source: string): Promise<Blob> {
    const memory = this.memory.get(source);
    if (memory) {
      this.memory.delete(source); this.memory.set(source, memory);
      return Promise.resolve(memory);
    }
    const existing = this.pending.get(source);
    if (existing) return existing;
    // Deduplicate the entire DB read/download/encode operation, not just fetch.
    const work = (async () => {
      const cached = await this.cache.get(source).catch(() => undefined);
      if (!cached && (this.failedUntil.get(source) || 0) > Date.now()) throw new Error('封面暂不可用');
      const blob = cached || await this.fetchAndStore(source);
      this.failedUntil.delete(source);
      this.memory.set(source, blob); this.memoryBytes += blob.size;
      while (this.memoryBytes > 8 * 1024 * 1024 || this.memory.size > 64) {
        const oldest = this.memory.keys().next().value!;
        this.memoryBytes -= this.memory.get(oldest)!.size; this.memory.delete(oldest);
      }
      return blob;
    })().catch(error => {
      this.failedUntil.set(source, Date.now() + 30_000);
      if (this.failedUntil.size > 100) this.failedUntil.delete(this.failedUntil.keys().next().value!);
      throw error;
    }).finally(() => this.pending.delete(source));
    this.pending.set(source, work);
    return work;
  }

  private async fetchAndStore(source: string): Promise<Blob> {
    if (this.active >= 3) await new Promise<void>(resolve => this.waiting.push(resolve));
    else this.active++;
    try {
      const requestUrl = artworkRequestUrl(source);
      const domestic = isDomesticArtwork(source);
      let raw: Blob;
      try { raw = await this.fetchImage(domestic ? source : requestUrl, domestic ? 2500 : 9000); }
      catch (error) {
        if (!publicArtworkUrl(source)) throw error;
        raw = await this.fetchImage(domestic ? requestUrl : source, domestic ? 9000 : 4000);
      }
      const blob = await this.compress(raw, true);
      // A quota failure must not stop the current image from displaying.
      await this.cache.put(source, blob).catch(() => undefined);
      return blob;
    } finally { const next = this.waiting.shift(); if (next) next(); else this.active--; }
  }

  private async fetchImage(url: string, timeout: number): Promise<Blob> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      const type = response.headers.get('content-type')?.split(';')[0] || '';
      if (!response.ok || !/^image\/(jpeg|png|webp|gif|avif)$/i.test(type) || Number(response.headers.get('content-length')) > MAX_DOWNLOAD_BYTES) {
        await response.body?.cancel();
        throw new Error('封面暂不可用');
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('封面内容为空');
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          size += next.value.byteLength;
          if (size > MAX_DOWNLOAD_BYTES) throw new Error('封面过大');
          chunks.push(next.value);
        }
      } finally { await reader.cancel(); }
      return new Blob(chunks as BlobPart[], { type });
    } finally { clearTimeout(timer); }
  }

  private async compress(blob: Blob, allowOriginal = false): Promise<Blob> {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('无法读取封面');
      if (allowOriginal && Math.max(image.naturalWidth, image.naturalHeight) <= 800 && blob.size <= 256 * 1024) return blob;
      const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('封面压缩不可用');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('封面压缩失败')), 'image/webp', .82));
      if (compressed.size > ARTWORK_ITEM_LIMIT) throw new Error('封面压缩后仍过大，请选择较小的图片');
      return compressed;
    } finally { URL.revokeObjectURL(url); }
  }
}

export const artworkService = new WebArtworkAdapter();
