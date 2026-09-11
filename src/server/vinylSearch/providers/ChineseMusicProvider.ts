import Meting from '@meting/core';
import { ProviderHttpError } from '../errors.js';
import { logProviderHits } from '../http.js';
import type { ProviderAlbum, ProviderAvailability, ProviderPlatformStatus, VinylSearchProvider } from '../types.js';
import { duration, normalizeText } from '../utils.js';

type MetingPlatform = 'netease' | 'tencent' | 'kugou' | 'kuwo';
type RawSong = Record<string, any>;

const platforms: MetingPlatform[] = ['netease', 'tencent', 'kugou', 'kuwo'];
const PLATFORM_TIMEOUT_MS = 7000;
const PLATFORM_LIMIT = 30;

function asArray(value: unknown): RawSong[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as RawSong[] : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function firstText(...values: unknown[]): string {
  return values.map(text).find(Boolean) || '';
}

function toYear(value: unknown): number | undefined {
  const numeric = typeof value === 'number' ? value : Number(text(value));
  if (Number.isFinite(numeric) && numeric >= 1900 && numeric <= 2100) return numeric;
  if (Number.isFinite(numeric) && numeric > 100000000000) return new Date(numeric).getUTCFullYear();
  const match = text(value).match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function toSeconds(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 10000 ? Math.round(value / 1000) : Math.round(value);
  const raw = text(value);
  const parts = raw.split(':').map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1];
  return Number.isFinite(Number(raw)) ? Number(raw) : 0;
}

function coverUrl(platform: MetingPlatform, song: RawSong): string | undefined {
  if (platform === 'netease') return firstText(song.al?.picUrl, song.album?.picUrl, song.picUrl) || undefined;
  if (platform === 'tencent') {
    const mid = firstText(song.album?.mid, song.album?.pmid);
    return mid ? `https://y.gtimg.cn/music/photo_new/T002R500x500M000${mid}.jpg` : undefined;
  }
  if (platform === 'kugou') {
    const raw = firstText(song.trans_param?.union_cover, song.imgUrl, song.album_img);
    return raw ? raw.replace('{size}', '500') : undefined;
  }
  return firstText(song.pic, song.albumpic, song.album_pic, song.picUrl) || undefined;
}

function artistName(platform: MetingPlatform, song: RawSong): string {
  if (platform === 'netease') return firstText(song.ar?.map((item: RawSong) => item?.name).filter(Boolean).join(', '), song.artist);
  if (platform === 'tencent') return firstText(song.singer?.map((item: RawSong) => item?.name).filter(Boolean).join(', '), song.singername);
  return firstText(song.singername, song.artist, song.artistName, song.authors?.map((item: RawSong) => item?.author_name).filter(Boolean).join(', '));
}

function albumName(platform: MetingPlatform, song: RawSong): string {
  if (platform === 'netease') return firstText(song.al?.name, song.album?.name, song.album);
  if (platform === 'tencent') return firstText(song.album?.name, song.album?.title, song.album);
  return firstText(song.album_name, song.album, song.albumName, song.album_title);
}

function songTitle(song: RawSong): string {
  return firstText(song.name, song.title, song.songname, song.songName) || '未命名歌曲';
}

function songId(platform: MetingPlatform, song: RawSong): string {
  return firstText(song.id, song.mid, song.rid, song.hash, song.audio_id, song.album_audio_id) || songTitle(song);
}

function extractSongs(platform: MetingPlatform, payload: RawSong): RawSong[] {
  if (platform === 'netease') return asArray(payload.result?.songs);
  if (platform === 'tencent') return asArray(payload.data?.song?.list);
  if (platform === 'kugou') return asArray(payload.data?.info);
  return asArray(payload.data?.list);
}

function isPlatformFailure(platform: MetingPlatform, payload: RawSong, songs: RawSong[]) {
  if (platform === 'kuwo' && payload.success === false) return firstText(payload.message, 'Kuwo returned success=false');
  if (!songs.length && (payload.code && payload.code !== 200 && payload.code !== 0)) return `provider code ${payload.code}`;
  return '';
}

function mapAlbums(platform: MetingPlatform, songs: RawSong[]): ProviderAlbum[] {
  const grouped = new Map<string, { album: ProviderAlbum; songs: RawSong[] }>();
  for (const song of songs) {
    const title = albumName(platform, song);
    const artist = artistName(platform, song);
    if (!title || !artist) continue;
    const key = `${normalizeText(artist)}|${normalizeText(title)}`;
    const current = grouped.get(key);
    const trackSeconds = toSeconds(song.interval ?? song.duration ?? song.dt);
    const track = {
      id: `meting-${platform}-${songId(platform, song)}`,
      number: (current?.songs.length ?? 0) + 1,
      title: songTitle(song),
      duration: duration(trackSeconds * 1000),
      durationSec: trackSeconds,
    };
    if (current) {
      current.songs.push(song);
      current.album.tracks = [...(current.album.tracks ?? []), track];
      if (!current.album.coverUrl) current.album.coverUrl = coverUrl(platform, song);
      continue;
    }
    const id = songId(platform, song);
    const releaseDate = [song.time_public, song.publishTime, song.publish_time, song.releaseDate].map(value => text(value)).find(value => Boolean(toYear(value))) || '';
    grouped.set(key, {
      songs: [song],
      album: {
        provider: 'chinese-music',
        providerId: `${platform}:${firstText(song.album?.mid, song.album?.id, song.album_id, song.albumid, song.al?.id, id)}`,
        role: 'identity',
        title,
        artist,
        releaseDate: releaseDate || undefined,
        year: toYear(releaseDate),
        coverUrl: coverUrl(platform, song),
        genres: [firstText(song.genre_name, song.genre)].filter(Boolean),
        tracks: [track],
        rawScore: 55,
        isVinylRelease: false,
      },
    });
  }
  return [...grouped.values()].map(({ album }) => album);
}

export class ChineseMusicProvider implements VinylSearchProvider {
  public readonly id = 'chinese-music' as const;
  public readonly role = 'identity' as const;
  public readonly priority = 2;
  private readonly stats: Record<string, ProviderPlatformStatus> = {};

  public availability(): ProviderAvailability { return { available: true, reason: '@meting/core unified metadata search' }; }

  public getLastSearchStats() { return { ...this.stats }; }

  public async search(query: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    if (!/[\u3400-\u9fff]/u.test(query)) {
      for (const platform of platforms) this.stats[platform] = { attempted: false, hitCount: 0, durationMs: 0, errorCode: 'skipped', error: 'non-Chinese query' };
      console.log(`[vinyl-search][${this.id}] skipped non-Chinese query`);
      return [];
    }
    const results = await Promise.all(platforms.map(platform => this.searchPlatform(platform, query)));
    const merged = new Map<string, ProviderAlbum>();
    for (const albums of results) {
      for (const album of albums) {
        const key = `${normalizeText(album.artist)}|${normalizeText(album.title)}`;
        const existing = merged.get(key);
        if (!existing || (!existing.coverUrl && album.coverUrl) || (album.tracks?.length ?? 0) > (existing.tracks?.length ?? 0)) merged.set(key, existing ? { ...existing, ...album, providerId: `${existing.providerId},${album.providerId}`, coverUrl: album.coverUrl || existing.coverUrl, tracks: (album.tracks?.length ?? 0) > (existing.tracks?.length ?? 0) ? album.tracks : existing.tracks } : album);
      }
    }
    logProviderHits(this.id, 'search', merged.size, started);
    return [...merged.values()];
  }

  public async searchByBarcode(_barcode: string): Promise<ProviderAlbum[]> {
    for (const platform of platforms) this.stats[platform] = { attempted: false, hitCount: 0, durationMs: 0, errorCode: 'unsupported' , error: 'Meting platforms do not expose barcode search' };
    console.log('[vinyl-search][chinese-music] barcode lookup skipped: @meting/core has no barcode endpoint');
    return [];
  }

  public async getAlbum(_id: string): Promise<ProviderAlbum | null> { return null; }

  private async searchPlatform(platform: MetingPlatform, query: string): Promise<ProviderAlbum[]> {
    const started = Date.now();
    try {
      const meting = new Meting(platform);
      const raw = await this.withTimeout(meting.search(query, { page: 1, limit: PLATFORM_LIMIT }), PLATFORM_TIMEOUT_MS);
      const payload = JSON.parse(String(raw)) as RawSong;
      const songs = extractSongs(platform, payload);
      const failure = isPlatformFailure(platform, payload, songs);
      const albums = failure ? [] : mapAlbums(platform, songs);
      const status: ProviderPlatformStatus = { attempted: true, hitCount: albums.length, durationMs: Date.now() - started, coverCount: albums.filter(item => item.coverUrl).length, chineseTitleCount: albums.filter(item => /[\u3400-\u9fff]/u.test(item.title) || /[\u3400-\u9fff]/u.test(item.artist)).length };
      if (failure) status.error = failure;
      if (failure) status.errorCode = 'provider_response';
      this.stats[platform] = status;
      if (failure) console.warn(`[vinyl-search][chinese-music][${platform}] failed reason=${failure}`);
      else console.log(`[vinyl-search][chinese-music][${platform}] hits=${albums.length} songs=${songs.length} durationMs=${status.durationMs}`);
      return albums;
    } catch (error) {
      const status: ProviderPlatformStatus = { attempted: true, hitCount: 0, durationMs: Date.now() - started, errorCode: error instanceof ProviderHttpError ? error.code || 'provider_error' : 'provider_error', error: error instanceof Error ? error.message : String(error) };
      this.stats[platform] = status;
      console.error(`[vinyl-search][chinese-music][${platform}] failed reason=${status.error}`);
      return [];
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ProviderHttpError(this.id, undefined, `timeout after ${timeoutMs}ms`)), timeoutMs); });
    try { return await Promise.race([promise, timeout]); }
    finally { if (timer) clearTimeout(timer); }
  }
}
