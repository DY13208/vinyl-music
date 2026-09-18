import { vinylDatabase } from '../db/VinylDatabase';
import { ArtworkCache, ARTWORK_ITEM_LIMIT, albumArtworkSources } from './ArtworkCache';
import { artworkKey, artworkRequestUrl, publicArtworkUrl } from '../../utils/artworkUrl';
import type { Album } from '../../types';

export type ResolvedArtwork = { url: string; local: boolean; release: () => void };
const MAX_DOWNLOAD_BYTES = 3 * 1024 * 1024;

export class WebArtworkAdapter {
  private cache = new ArtworkCache(vinylDatabase);
  private pending = new Map<string, Promise<Blob>>();
  private active = 0;
  private waiting: Array<() => void> = [];

  async resolve(source: string): Promise<ResolvedArtwork> {
    const key = artworkKey(source);
    if (!key || /^(data:|blob:|\/(?!\/))/.test(key)) return { url: key, local: true, release() {} };
    try {
      const cached = await this.cache.get(key).catch(() => undefined);
      const blob = cached || await this.download(key);
      const url = URL.createObjectURL(blob);
      return { url, local: true, release: () => URL.revokeObjectURL(url) };
    } catch {
      // A direct image can still display when CORS/storage is unavailable.
      return { url: key, local: false, release() {} };
    }
  }

  async prefetchCollection(albums: Album[]) {
    const queue = albumArtworkSources(albums).filter(source => /^https?:|^\/\//.test(source));
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length) { const artwork = await this.resolve(queue.shift()!); artwork.release(); }
    }));
  }

  stats() { return this.cache.stats(); }
  clearBrowsing() { return this.cache.clearBrowsing(); }
  onOnline(retry: () => void) {
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
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

  private download(source: string): Promise<Blob> {
    const existing = this.pending.get(source);
    if (existing) return existing;
    const work = this.fetchAndStore(source).finally(() => this.pending.delete(source));
    this.pending.set(source, work);
    return work;
  }

  private async fetchAndStore(source: string): Promise<Blob> {
    if (this.active >= 3) await new Promise<void>(resolve => this.waiting.push(resolve));
    else this.active++;
    try {
      const requestUrl = artworkRequestUrl(source);
      let raw: Blob;
      try { raw = await this.fetchImage(requestUrl); }
      catch (error) {
        if (!publicArtworkUrl(source)) throw error;
        raw = await this.fetchImage(source);
      }
      const blob = await this.compress(raw);
      // A quota failure must not stop the current image from displaying.
      await this.cache.put(source, blob).catch(() => undefined);
      return blob;
    } finally { const next = this.waiting.shift(); if (next) next(); else this.active--; }
  }

  private async fetchImage(url: string): Promise<Blob> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
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

  private async compress(blob: Blob): Promise<Blob> {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('无法读取封面');
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
