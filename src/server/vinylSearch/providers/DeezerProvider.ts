import { logProviderHits, requestJson } from '../http.js';
import type { ProviderAlbum, ProviderAvailability, VinylSearchProvider } from '../types.js';
import { duration } from '../utils.js';

type DeezerTrack = { id?: number; title?: string; duration?: number; track_position?: number };
type DeezerAlbum = { id?: number; title?: string; artist?: { name?: string }; release_date?: string; cover_big?: string; cover_medium?: string; genres?: { data?: Array<{ name?: string }> }; tracks?: { data?: DeezerTrack[] }; label?: string; upc?: string; error?: { message?: string; code?: number } };

export class DeezerProvider implements VinylSearchProvider {
  public readonly id = 'deezer' as const;
  public readonly role = 'identity' as const;
  public readonly priority = 9;
  private readonly cache = new Map<string, ProviderAlbum>();

  public availability(): ProviderAvailability { return { available: true }; }

  public async search(query: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const payload = await requestJson<{ data?: DeezerAlbum[] }>(this.id, `https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=15`);
    const matches = (payload.data ?? []).filter(item => item.id && item.title).map(item => this.map(item));
    logProviderHits(this.id, 'search', matches.length, started);
    return matches;
  }

  public async searchByBarcode(barcode: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const direct = await requestJson<DeezerAlbum>(this.id, `https://api.deezer.com/album/upc/${encodeURIComponent(barcode)}`);
    let matches = direct.title && !direct.error ? [this.map(direct)] : [];
    if (!matches.length) {
      if (direct.error) console.warn(`[vinyl-search][deezer] upc_not_supported code=${direct.error.code ?? 'unknown'} reason=${direct.error.message ?? 'unknown'}`);
      const payload = await requestJson<{ data?: DeezerAlbum[] }>(this.id, `https://api.deezer.com/search/album?q=${encodeURIComponent(`upc:${barcode}`)}&limit=15`);
      matches = (payload.data ?? []).filter(item => item.id && item.title).map(item => this.map(item));
    }
    logProviderHits(this.id, 'searchByBarcode', matches.length, started);
    return matches;
  }

  public async getAlbum(id: string): Promise<ProviderAlbum | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const payload = await requestJson<DeezerAlbum>(this.id, `https://api.deezer.com/album/${encodeURIComponent(id)}`);
    if (!payload.title || payload.error) return null;
    const mapped = this.map(payload);
    this.cache.set(id, mapped);
    return mapped;
  }

  private map(item: DeezerAlbum): ProviderAlbum {
    const tracks = (item.tracks?.data ?? []).map((track, index) => ({
      id: `deezer-${item.id ?? 'album'}-${track.id ?? index}`,
      number: track.track_position || index + 1,
      title: track.title || `Track ${index + 1}`,
      duration: duration((track.duration ?? 0) * 1000),
      durationSec: track.duration ?? 0,
    }));
    return {
      provider: this.id,
      providerId: String(item.id ?? ''),
      role: this.role,
      title: item.title || '未命名专辑',
      artist: item.artist?.name || '未知艺术家',
      releaseDate: item.release_date,
      year: Number(item.release_date?.slice(0, 4)) || undefined,
      coverUrl: item.cover_big || item.cover_medium,
      genres: item.genres?.data?.map(genre => genre.name).filter((name): name is string => Boolean(name)),
      label: item.label,
      barcode: item.upc,
      tracks,
      isVinylRelease: false,
    };
  }
}
