import { ProviderUnavailableError } from '../errors.js';
import { logProviderHits, providerUserAgent, requestJson } from '../http.js';
import type { ProviderAlbum, ProviderAvailability, VinylSearchProvider } from '../types.js';
import { duration } from '../utils.js';

type AppleArtwork = { url?: string };
type AppleAttributes = { name?: string; artistName?: string; artwork?: AppleArtwork; releaseDate?: string; genreNames?: string[]; recordLabel?: string; upc?: string; trackCount?: number; durationInMillis?: number; trackNumber?: number };
type AppleResource = { id: string; attributes?: AppleAttributes; relationships?: { tracks?: { data?: AppleResource[] } } };
type AppleResponse = { data?: AppleResource[]; results?: { albums?: { data?: AppleResource[] } } };

export class AppleMusicProvider implements VinylSearchProvider {
  public readonly id = 'apple-music' as const;
  public readonly role = 'identity' as const;
  public readonly priority = 2;
  private readonly token = process.env.APPLE_MUSIC_DEVELOPER_TOKEN || process.env.APPLE_MUSIC_TOKEN;
  private readonly baseUrl = 'https://api.music.apple.com/v1/catalog/cn';

  public availability(): ProviderAvailability {
    return this.token
      ? { available: true }
      : { available: false, reason: '缺少 Apple Music Developer Token', requires: ['APPLE_MUSIC_DEVELOPER_TOKEN'] };
  }

  public async search(query: string): Promise<ProviderAlbum[]> {
    this.assertAvailable();
    const started = Date.now();
    const payload = await requestJson<AppleResponse>(this.id, `${this.baseUrl}/search?term=${encodeURIComponent(query)}&types=albums&limit=15&l=zh-Hans-CN`, { headers: this.headers() });
    const matches = (payload.results?.albums?.data ?? []).map(item => this.map(item));
    logProviderHits(this.id, 'search', matches.length, started);
    return matches;
  }

  public async searchByBarcode(barcode: string): Promise<ProviderAlbum[]> {
    this.assertAvailable();
    const started = Date.now();
    const filtered = await requestJson<AppleResponse>(this.id, `${this.baseUrl}/albums?filter[upc]=${encodeURIComponent(barcode)}&include=tracks&l=zh-Hans-CN`, { headers: this.headers() });
    let matches = (filtered.data ?? []).map(item => this.map(item));
    if (!matches.length) matches = await this.search(barcode);
    logProviderHits(this.id, 'searchByBarcode', matches.length, started);
    return matches;
  }

  public async getAlbum(id: string): Promise<ProviderAlbum | null> {
    this.assertAvailable();
    const payload = await requestJson<AppleResponse>(this.id, `${this.baseUrl}/albums/${encodeURIComponent(id)}?include=tracks&l=zh-Hans-CN`, { headers: this.headers() });
    return payload.data?.[0] ? this.map(payload.data[0]) : null;
  }

  private assertAvailable() {
    if (!this.token) throw new ProviderUnavailableError(this.id, '缺少 APPLE_MUSIC_DEVELOPER_TOKEN');
  }

  private headers() {
    return { Authorization: `Bearer ${this.token}`, Accept: 'application/json', 'Accept-Language': 'zh-Hans-CN', 'User-Agent': providerUserAgent };
  }

  private map(item: AppleResource): ProviderAlbum {
    const attributes = item.attributes ?? {};
    const tracks = (item.relationships?.tracks?.data ?? []).map((track, index) => ({
      id: `apple-${track.id}`,
      number: track.attributes?.trackNumber || index + 1,
      title: track.attributes?.name || `Track ${index + 1}`,
      duration: duration(track.attributes?.durationInMillis),
      durationSec: Math.round((track.attributes?.durationInMillis ?? 0) / 1000),
    }));
    return {
      provider: this.id,
      providerId: item.id,
      role: this.role,
      title: attributes.name || '未命名专辑',
      artist: attributes.artistName || '未知艺术家',
      releaseDate: attributes.releaseDate,
      year: Number(attributes.releaseDate?.slice(0, 4)) || undefined,
      coverUrl: attributes.artwork?.url?.replace('{w}', '1200').replace('{h}', '1200'),
      genres: attributes.genreNames,
      label: attributes.recordLabel,
      barcode: attributes.upc,
      tracks,
      isVinylRelease: false,
    };
  }
}
