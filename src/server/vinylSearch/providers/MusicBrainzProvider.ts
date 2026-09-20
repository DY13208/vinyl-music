import { ProviderHttpError } from '../errors.js';
import { logProviderHits, providerUserAgent, requestJson } from '../http.js';
import type { ProviderAlbum, ProviderAvailability, VinylSearchProvider } from '../types.js';
import { duration } from '../utils.js';

type MbTrack = { title?: string; length?: number; position?: string | number; recording?: { title?: string; length?: number } };
type MbMedium = { position?: number; format?: string; tracks?: MbTrack[] };
type MbRelease = { id: string; title?: string; date?: string; country?: string; barcode?: string; media?: MbMedium[]; 'artist-credit'?: Array<{ name?: string }>; 'label-info'?: Array<{ 'catalog-number'?: string; label?: { name?: string } }> };
type CaaResponse = { images?: Array<{ front?: boolean; image?: string; thumbnails?: Record<string, string> }> };

let queue = Promise.resolve();
let lastRequestAt = 0;

export class MusicBrainzProvider implements VinylSearchProvider {
  public readonly id = 'musicbrainz' as const;
  public readonly role = 'physical' as const;
  public readonly priority = 8;
  private readonly cache = new Map<string, ProviderAlbum>();

  public availability(): ProviderAvailability { return { available: true }; }

  public async search(query: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const separator = query.match(/\s[-–—]\s/);
    let expression: string;
    if (separator) {
      const [artist, ...album] = query.split(/\s[-–—]\s/);
      expression = `artist:"${artist.replace(/"/g, '')}" AND release:"${album.join(' ').replace(/"/g, '')}"`;
    } else {
      expression = `release:"${query.replace(/"/g, '')}"`;
    }
    let payload: { releases?: MbRelease[] };
    try {
      payload = await this.request<{ releases?: MbRelease[] }>(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(expression)}&fmt=json&limit=15`);
    } catch (error) {
      if (!separator || !this.isRetryable(error)) throw error;
      const albumOnly = query.split(/\s[-–—]\s/).slice(1).join(' ').trim();
      console.warn(`[vinyl-search][musicbrainz] fallback query=release-only title=${albumOnly}`);
      payload = await this.request<{ releases?: MbRelease[] }>(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(`release:"${albumOnly.replace(/"/g, '')}"`)}&fmt=json&limit=25`);
    }
    let releases = payload.releases ?? [];
    if (!releases.length && separator) {
      const albumOnly = query.split(/\s[-–—]\s/).slice(1).join(' ').trim();
      console.warn(`[vinyl-search][musicbrainz] fallback query=release-only title=${albumOnly}`);
      const fallback = await this.request<{ releases?: MbRelease[] }>(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(`release:"${albumOnly.replace(/"/g, '')}"`)}&fmt=json&limit=25`);
      releases = fallback.releases ?? [];
    }
    const matches = releases.map(release => this.map(release));
    logProviderHits(this.id, 'search', matches.length, started);
    return matches;
  }

  private isRetryable(error: unknown) {
    return error instanceof ProviderHttpError && (error.status === 503 || error.code === 'timeout');
  }

  public async searchByBarcode(barcode: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    const payload = await this.request<{ releases?: MbRelease[] }>(`https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(`barcode:${barcode}`)}&fmt=json&limit=15`);
    const matches = (payload.releases ?? []).map(release => this.map(release));
    logProviderHits(this.id, 'searchByBarcode', matches.length, started);
    return matches;
  }

  public async getAlbum(id: string): Promise<ProviderAlbum | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;
    const detail = await this.request<MbRelease>(`https://musicbrainz.org/ws/2/release/${encodeURIComponent(id)}?fmt=json&inc=recordings+labels+release-groups`);
    let coverUrl = '';
    try {
      const cover = await requestJson<CaaResponse>('cover-art', `https://coverartarchive.org/release/${encodeURIComponent(id)}`, { headers: this.headers() }, 3500);
      coverUrl = cover.images?.find(image => image.front)?.thumbnails?.['500'] || cover.images?.[0]?.image || '';
      console.log(`[vinyl-search][cover-art] hits=${cover.images?.length ?? 0}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[vinyl-search][cover-art] unavailable release=${id} reason=${reason}`);
    }
    const mapped = this.map(detail, coverUrl);
    this.cache.set(id, mapped);
    return mapped;
  }

  private request<T>(url: string): Promise<T> {
    const task = queue.then(async () => {
      const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const result = await requestJson<T>(this.id, url, { headers: this.headers() }, 3500);
          lastRequestAt = Date.now();
          return result;
        } catch (error) {
          lastRequestAt = Date.now();
          if (!(error instanceof ProviderHttpError) || error.status !== 503 || attempt === 2) throw error;
          console.warn(`[vinyl-search][musicbrainz] retry status=503 attempt=${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
      throw new ProviderHttpError(this.id, 503, '503 unavailable');
    });
    queue = task.then(() => undefined, () => undefined);
    return task;
  }

  private headers() { return { Accept: 'application/json', 'User-Agent': providerUserAgent }; }

  private map(release: MbRelease, coverUrl = ''): ProviderAlbum {
    const media = release.media ?? [];
    const tracks = media.flatMap((medium, discIndex) => (medium.tracks ?? []).map((track, trackIndex) => {
      const printedPosition = String(track.position ?? trackIndex + 1);
      const half = Math.ceil((medium.tracks?.length ?? 0) / 2);
      const side = /^[A-Z]/i.test(printedPosition) ? printedPosition[0].toUpperCase() : String.fromCharCode(65 + discIndex * 2 + (trackIndex >= half ? 1 : 0));
      const milliseconds = track.length ?? track.recording?.length ?? 0;
      return { id: `mb-${release.id}-${discIndex}-${trackIndex}`, number: Number(printedPosition.replace(/\D/g, '')) || trackIndex + 1, title: track.title || track.recording?.title || `Track ${trackIndex + 1}`, duration: duration(milliseconds), durationSec: Math.round(milliseconds / 1000), side };
    }));
    const formats = media.map(medium => medium.format).filter((format): format is string => Boolean(format));
    const labelInfo = release['label-info']?.[0];
    return {
      provider: this.id,
      providerId: release.id,
      role: this.role,
      title: release.title || '未命名唱片',
      artist: release['artist-credit']?.map(artist => artist.name).filter(Boolean).join(', ') || '未知艺术家',
      releaseDate: release.date,
      year: Number(release.date?.slice(0, 4)) || undefined,
      coverUrl,
      label: labelInfo?.label?.name,
      barcode: release.barcode,
      catalogNumber: labelInfo?.['catalog-number'],
      country: release.country,
      formats,
      edition: [release.country, formats.join(' + ')].filter(Boolean).join(' · '),
      tracks,
      isVinylRelease: formats.some(format => /vinyl|lp|12"|10"|7"/i.test(format)),
    };
  }
}
