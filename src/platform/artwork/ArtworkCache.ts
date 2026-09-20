import type { DatabaseAdapter, DatabaseTransaction } from '../db/DatabaseAdapter';
import type { Album } from '../../types';
import { artworkKey } from '../../utils/artworkUrl';

export const ARTWORK_CACHE_LIMIT = 32 * 1024 * 1024;
export const ARTWORK_ITEM_LIMIT = 512 * 1024;
const INDEX = 'artwork-cache-index';
type Entry = { source: string; bytes: number; usedAt: number };

export function albumArtworkSources(albums: Album[]): string[] {
  return [...new Set(albums.flatMap(album => [album.coverUrl, album.vinylLabel?.image,
    ...(album.discs?.flatMap(disc => disc.sides.map(side => side.labelImage)) || [])]
  ).filter((source): source is string => !!source).map(artworkKey))];
}

/** Only disposable browsing images are capped/cleared. Collection images stay local. */
export class ArtworkCache {
  constructor(private db: DatabaseAdapter, private limit = ARTWORK_CACHE_LIMIT) {}

  async get(source: string): Promise<Blob | undefined> {
    return this.db.transaction(['artwork', 'meta'], 'readwrite', async tx => {
      const blob = await tx.get<Blob>('artwork', source);
      if (blob) {
        const index = await tx.get<Entry[]>('meta', INDEX) || [];
        const entry = index.find(item => item.source === source);
        if (entry) { entry.usedAt = Date.now(); await tx.put('meta', INDEX, index); }
      }
      return blob;
    });
  }

  async put(source: string, blob: Blob) {
    if (blob.size > ARTWORK_ITEM_LIMIT) throw new Error('封面压缩后仍过大');
    await this.db.transaction(['artwork', 'meta', 'collections'], 'readwrite', async tx => {
      const index = (await tx.get<Entry[]>('meta', INDEX) || []).filter(entry => entry.source !== source);
      index.push({ source, bytes: blob.size, usedAt: Date.now() });
      await tx.put('artwork', source, blob);
      await this.prune(tx, index, this.limit);
    });
  }

  async clearBrowsing() {
    await this.db.transaction(['artwork', 'meta', 'collections'], 'readwrite', async tx => {
      await this.prune(tx, await tx.get<Entry[]>('meta', INDEX) || [], 0);
    });
  }

  async stats() {
    return this.db.transaction(['meta', 'collections'], 'readonly', async tx => {
      const albums = await tx.get<Album[]>('collections', 'vinyl_user_collection') || [];
      const owned = new Set(albumArtworkSources(albums));
      const index = await tx.get<Entry[]>('meta', INDEX) || [];
      const saved = index.filter(entry => owned.has(entry.source));
      const uploadedBytes = [...owned].filter(source => source.startsWith('data:')).reduce((sum, source) => sum + Math.ceil((source.split(',')[1]?.length || 0) * .75), 0);
      return {
        browsingBytes: index.filter(entry => !owned.has(entry.source)).reduce((sum, entry) => sum + entry.bytes, 0),
        collectionBytes: saved.reduce((sum, entry) => sum + entry.bytes, uploadedBytes),
        pendingCount: [...owned].filter(source => /^https?:|^\/\//.test(source) && !saved.some(entry => entry.source === source)).length,
      };
    });
  }

  private async prune(tx: DatabaseTransaction, index: Entry[], limit: number) {
    const owned = new Set(albumArtworkSources(await tx.get<Album[]>('collections', 'vinyl_user_collection') || []));
    const disposable = index.filter(entry => !owned.has(entry.source)).sort((a, b) => a.usedAt - b.usedAt);
    let size = disposable.reduce((sum, entry) => sum + entry.bytes, 0);
    const removed = new Set<string>();
    for (const entry of disposable) {
      if (size <= limit) break;
      await tx.delete('artwork', entry.source);
      size -= entry.bytes;
      removed.add(entry.source);
    }
    await tx.put('meta', INDEX, index.filter(entry => !removed.has(entry.source)));
  }
}
