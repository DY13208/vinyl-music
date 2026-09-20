import { logProviderHits, providerUserAgent, requestJson } from '../http.js';
import type { ProviderAlbum, ProviderAvailability, VinylSearchProvider } from '../types.js';
import { trackDiscs } from '../utils.js';

type DiscogsSearchResult = { id: number; type?: string; title?: string; year?: string; country?: string; format?: string[]; genre?: string[]; label?: string[]; catno?: string; cover_image?: string; thumb?: string; barcode?: string[] };
type DiscogsRelease = DiscogsSearchResult & { artists?: Array<{ name?: string }>; labels?: Array<{ name?: string; catno?: string }>; formats?: Array<{ name?: string; qty?: string; text?: string; descriptions?: string[] }>; tracklist?: Array<{ type_?: string; position?: string; title?: string; duration?: string }>; images?: Array<{ type?: string; uri?: string; uri150?: string }>; identifiers?: Array<{ type?: string; value?: string }>; released?: string };

function secondsFromDuration(value = '') {
  const match = value.match(/^(\d+):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export class DiscogsProvider implements VinylSearchProvider {
  public readonly id = 'discogs' as const;
  public readonly role = 'physical' as const;
  public readonly priority = 7;
  private readonly token = process.env.DISCOGS_TOKEN || process.env.DISCOGS_API_TOKEN;
  private readonly cache = new Map<string, ProviderAlbum>();

  public availability(): ProviderAvailability { return { available: true, reason: this.token ? '使用后端 Token' : '匿名访问，速率限制较低' }; }

  public async search(query: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const payload = await requestJson<{ results?: DiscogsSearchResult[] }>(this.id, `https://api.discogs.com/database/search?type=release&format=Vinyl&per_page=15&q=${encodeURIComponent(query)}`, { headers: this.headers() });
    const matches = (payload.results ?? []).filter(item => item.type === 'release' || !item.type).map(item => this.mapSearch(item));
    logProviderHits(this.id, 'search', matches.length, started);
    return matches;
  }

  public async searchByBarcode(barcode: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    let payload = await requestJson<{ results?: DiscogsSearchResult[] }>(this.id, `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&type=release&format=Vinyl&per_page=15`, { headers: this.headers() });
    if (!(payload.results ?? []).length) {
      payload = await requestJson<{ results?: DiscogsSearchResult[] }>(this.id, `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcode)}&type=release&per_page=15`, { headers: this.headers() });
    }
    const matches = (payload.results ?? []).filter(item => item.type === 'release' || !item.type).map(item => this.mapSearch(item, barcode));
    logProviderHits(this.id, 'searchByBarcode', matches.length, started);
    return matches;
  }

  public async getAlbum(id: string): Promise<ProviderAlbum | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const detail = await requestJson<DiscogsRelease>(this.id, `https://api.discogs.com/releases/${encodeURIComponent(id)}`, { headers: this.headers() });
    const mapped = this.mapDetail(detail);
    this.cache.set(id, mapped);
    return mapped;
  }

  private headers() {
    console.log(`[vinyl-search][discogs] auth=${this.token ? 'server-token' : 'anonymous'}`);
    return { Accept: 'application/json', 'User-Agent': providerUserAgent, ...(this.token ? { Authorization: `Discogs token=${this.token}` } : {}) };
  }

  private mapSearch(item: DiscogsSearchResult, barcode?: string): ProviderAlbum {
    const [artist, ...title] = (item.title || '').split(' - ');
    const formats = item.format ?? [];
    return {
      provider: this.id,
      providerId: String(item.id),
      role: this.role,
      title: title.join(' - ') || artist || '未命名唱片',
      artist: title.length ? artist : '未知艺术家',
      year: Number(item.year) || undefined,
      coverUrl: item.cover_image || item.thumb,
      genres: item.genre,
      label: item.label?.[0],
      barcode: barcode || item.barcode?.[0],
      catalogNumber: item.catno,
      country: item.country,
      formats,
      edition: formats.join(' · '),
      isVinylRelease: formats.some(format => /vinyl|lp|12"|10"|7"/i.test(format)),
    };
  }

  private mapDetail(item: DiscogsRelease): ProviderAlbum {
    const summary = this.mapSearch(item);
    const tracks = (item.tracklist ?? []).filter(track => track.type_ !== 'heading' && track.title).map((track, index) => {
      const seconds = secondsFromDuration(track.duration);
      const position = track.position || String(index + 1);
      const side = /^[A-Z]/i.test(position) ? position[0].toUpperCase() : 'A';
      return { id: `discogs-${item.id}-${index}`, number: Number(position.replace(/\D/g, '')) || index + 1, title: track.title || `Track ${index + 1}`, duration: track.duration || '0:00', durationSec: seconds, side };
    });
    const formats = item.formats ?? [];
    const formatText = formats.map(format => [format.qty, format.name, format.text, ...(format.descriptions ?? [])].filter(Boolean).join(' '));
    const image = item.images?.find(candidate => candidate.type === 'primary') ?? item.images?.[0];
    const barcode = item.identifiers?.find(identifier => /barcode/i.test(identifier.type ?? ''))?.value?.replace(/\D/g, '');
    const matrixCode = item.identifiers?.filter(identifier => /matrix|runout/i.test(identifier.type ?? '')).map(identifier => identifier.value).filter(Boolean).join(' / ');
    return {
      ...summary,
      title: item.title || summary.title,
      artist: item.artists?.map(artist => artist.name).filter(Boolean).join(', ') || summary.artist,
      releaseDate: item.released,
      year: Number((item.released || item.year || '').toString().slice(0, 4)) || summary.year,
      coverUrl: image?.uri || image?.uri150 || summary.coverUrl,
      label: item.labels?.[0]?.name || summary.label,
      barcode: barcode || summary.barcode,
      catalogNumber: item.labels?.[0]?.catno || summary.catalogNumber,
      formats: formatText,
      rpm: formatText.find(value => /45\s*rpm/i.test(value)) ? '45 RPM' : formatText.find(value => /33/i.test(value)) ? '33 ⅓ RPM' : undefined,
      lpCount: formats.reduce((sum, format) => sum + (/vinyl|lp/i.test(format.name ?? '') ? Number(format.qty) || 1 : 0), 0) || undefined,
      edition: [item.country, ...formatText].filter(Boolean).join(' · '),
      matrixCode,
      tracks,
      discs: trackDiscs(tracks),
      isVinylRelease: formats.some(format => /vinyl|lp/i.test(format.name ?? '')),
    };
  }
}
