import type { Album } from '../../types.js';
import { ProviderHttpError, ProviderUnavailableError } from './errors.js';
import { AppleMusicProvider } from './providers/AppleMusicProvider.js';
import { ChineseMusicProvider } from './providers/ChineseMusicProvider.js';
import { DeezerProvider } from './providers/DeezerProvider.js';
import { DiscogsProvider } from './providers/DiscogsProvider.js';
import { LocalDatabaseProvider } from './providers/LocalDatabaseProvider.js';
import { MusicBrainzProvider } from './providers/MusicBrainzProvider.js';
import type { ProviderAlbum, ProviderSearchStatus, VinylSearchMatch, VinylSearchProvider, VinylSearchQuery, VinylSearchResponse } from './types.js';
import { normalizeBarcode, normalizeText, providerAlbumToAlbum, queryForProvider } from './utils.js';

const CACHE_TTL_MS = 10 * 60 * 1000;

type CachedResponse = { expiresAt: number; response: VinylSearchResponse };
type ScoredCandidate = ProviderAlbum & { matchConfidence: number };

function similarity(left = '', right = '') {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  const aPairs = new Set(Array.from({ length: Math.max(0, a.length - 1) }, (_, index) => a.slice(index, index + 2)));
  const bPairs = new Set(Array.from({ length: Math.max(0, b.length - 1) }, (_, index) => b.slice(index, index + 2)));
  if (!aPairs.size || !bPairs.size) return 0;
  const overlap = [...aPairs].filter(pair => bPairs.has(pair)).length;
  return (2 * overlap) / (aPairs.size + bPairs.size);
}

function scoreCandidate(input: VinylSearchQuery, candidate: ProviderAlbum) {
  if (input.barcode) {
    if (normalizeBarcode(candidate.barcode) === input.barcode) return 100;
    return 92;
  }
  if (input.catalogNumber && normalizeText(candidate.catalogNumber) === normalizeText(input.catalogNumber)) return 96;
  const titleTarget = input.album || input.query;
  const artistTarget = input.artist || '';
  const titleScore = similarity(titleTarget, candidate.title);
  const artistScore = artistTarget ? similarity(artistTarget, candidate.artist) : 0;
  let score = Math.round(titleScore * (artistTarget ? 52 : 78) + artistScore * 38);
  if (input.year && candidate.year && input.year === candidate.year) score += 10;
  if (input.catalogNumber && candidate.catalogNumber) score = Math.max(score, Math.round(similarity(input.catalogNumber, candidate.catalogNumber) * 92));
  return Math.min(100, score);
}

function groupKey(candidate: ProviderAlbum) {
  const title = candidate.title.replace(/[（(][^）)]*[）)]/g, '');
  return `${normalizeText(candidate.artist)}|${normalizeText(title)}`;
}

function mergeAlbum(primary: ProviderAlbum, candidates: ScoredCandidate[]): Album {
  const album = providerAlbumToAlbum(primary);
  const first = <K extends keyof ProviderAlbum>(key: K) => candidates.map(candidate => candidate[key]).find(value => value !== undefined && value !== '' && (!Array.isArray(value) || value.length));
  album.coverUrl ||= String(first('coverUrl') ?? '');
  album.label = album.label === '未知厂牌' ? String(first('label') ?? album.label) : album.label;
  album.genre = album.genre === '其他' ? ((first('genres') as string[] | undefined)?.join(' · ') || album.genre) : album.genre;
  album.barcode ||= String(first('barcode') ?? '') || undefined;
  album.catalogNumber ||= String(first('catalogNumber') ?? '') || undefined;
  album.country ||= String(first('country') ?? '') || undefined;
  if (!album.tracks.length) {
    const tracks = first('tracks') as Album['tracks'] | undefined;
    if (tracks?.length) {
      album.tracks = tracks;
      album.trackCount = tracks.length;
      const total = tracks.reduce((sum, track) => sum + track.durationSec, 0);
      album.totalDuration = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    }
  }
  return album;
}

export class VinylSearchService {
  private readonly cache = new Map<string, CachedResponse>();

  public constructor(private readonly providers: VinylSearchProvider[] = [
    new LocalDatabaseProvider(),
    new ChineseMusicProvider(),
    new AppleMusicProvider(),
    new DiscogsProvider(),
    new MusicBrainzProvider(),
    new DeezerProvider(),
  ]) {}

  public async search(input: VinylSearchQuery): Promise<VinylSearchResponse> {
    const cacheKey = JSON.stringify(input);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[vinyl-search] cache_hit query=${JSON.stringify(input.query || input.barcode)}`);
      return { ...cached.response, cached: true };
    }

    const ordered = [...this.providers].sort((a, b) => a.priority - b.priority);
    const local = ordered.filter(provider => provider.role === 'local');
    const remote = ordered.filter(provider => provider.role !== 'local');
    const localRuns = await Promise.all(local.map(provider => this.runProvider(provider, input)));
    const remoteRuns = await Promise.all(remote.map(provider => this.runProvider(provider, input)));
    const runs = [...localRuns, ...remoteRuns];
    const rawCandidates = runs.flatMap(run => run.candidates);
    const enriched = await this.enrich(rawCandidates, ordered, input);
    const candidates = enriched.map(candidate => ({ ...candidate, matchConfidence: scoreCandidate(input, candidate) })).filter(candidate => candidate.matchConfidence >= 35).sort((a, b) => b.matchConfidence - a.matchConfidence || this.priorityOf(a.provider) - this.priorityOf(b.provider));
    const results = this.merge(candidates);
    const response: VinylSearchResponse = { query: input, results, providers: runs.map(run => run.status), cached: false, mergedAlbumCount: results.length };
    this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, response });
    console.log(`[vinyl-search] complete query=${JSON.stringify(input.query || input.barcode)} candidates=${candidates.length} results=${results.length}`);
    return response;
  }

  private async runProvider(provider: VinylSearchProvider, input: VinylSearchQuery): Promise<{ status: ProviderSearchStatus; candidates: ProviderAlbum[] }> {
    const availability = provider.availability();
    if (!availability.available) {
      console.warn(`[vinyl-search][${provider.id}] unavailable reason=${availability.reason}`);
      return { status: { provider: provider.id, ...availability, attempted: false, hitCount: 0, durationMs: 0, errorCode: 'unavailable' }, candidates: [] };
    }
    const started = Date.now();
    try {
      const candidates = input.barcode
        ? await provider.searchByBarcode(input.barcode)
        : await provider.search(queryForProvider(input));
      return { status: { provider: provider.id, ...availability, attempted: true, hitCount: candidates.length, durationMs: Date.now() - started, details: provider.getLastSearchStats?.() }, candidates };
    } catch (error) {
      const httpError = error instanceof ProviderHttpError ? error : undefined;
      const unavailable = error instanceof ProviderUnavailableError;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[vinyl-search][${provider.id}] failed reason=${message}`);
      return {
        status: {
          provider: provider.id,
          available: !unavailable,
          attempted: true,
          hitCount: 0,
          durationMs: Date.now() - started,
          httpStatus: httpError?.status,
          errorCode: unavailable ? 'unavailable' : httpError?.code || 'provider_error',
          error: message,
          details: provider.getLastSearchStats?.(),
        },
        candidates: [],
      };
    }
  }

  private async enrich(candidates: ProviderAlbum[], providers: VinylSearchProvider[], input: VinylSearchQuery) {
    const byProvider = new Map(providers.map(provider => [provider.id, provider]));
    const hasDiscogsPhysicalCandidate = candidates.some(candidate => candidate.provider === 'discogs' && candidate.isVinylRelease);
    const grouped = new Map<string, ProviderAlbum[]>();
    for (const candidate of candidates) grouped.set(candidate.provider, [...(grouped.get(candidate.provider) ?? []), candidate]);
    const enriched: ProviderAlbum[] = [];
    await Promise.all([...grouped].map(async ([providerId, items]) => {
      const provider = byProvider.get(providerId as ProviderAlbum['provider']);
      if (!provider || provider.role === 'local') { enriched.push(...items); return; }
      // Discogs already contains the physical pressing details. Keep the
      // MusicBrainz search results for cross-source matching, but avoid a
      // second 10-second detail request when a Discogs pressing is present.
      if (provider.id === 'musicbrainz' && hasDiscogsPhysicalCandidate) {
        enriched.push(...items);
        return;
      }
      if (hasDiscogsPhysicalCandidate && provider.role === 'identity') {
        enriched.push(...items);
        return;
      }
      const limit = provider.id === 'discogs' ? 1 : provider.id === 'musicbrainz' ? 1 : 1;
      const details = await Promise.all(items.slice(0, limit).map(async item => {
        try { return await provider.getAlbum(item.providerId) ?? item; }
        catch (error) {
          console.warn(`[vinyl-search][${provider.id}] detail_failed id=${item.providerId} reason=${error instanceof Error ? error.message : String(error)}`);
          return item;
        }
      }));
      enriched.push(...details, ...items.slice(limit));
    }));
    return enriched;
  }

  private merge(candidates: ScoredCandidate[]): VinylSearchMatch[] {
    const groups = new Map<string, ScoredCandidate[]>();
    for (const candidate of candidates) groups.set(groupKey(candidate), [...(groups.get(groupKey(candidate)) ?? []), candidate]);
    return [...groups.values()].map(group => {
      const sorted = [...group].sort((a, b) => b.matchConfidence - a.matchConfidence || this.priorityOf(a.provider) - this.priorityOf(b.provider));
      const identity = sorted.find(candidate => candidate.role !== 'physical') ?? sorted[0];
      const physical = sorted.find(candidate => candidate.role === 'physical' && candidate.isVinylRelease);
      const album = mergeAlbum(identity, sorted);
      const alternatives = sorted.filter(candidate => candidate.role === 'physical' && candidate.isVinylRelease).map(providerAlbumToAlbum);
      const vinylRelease = physical ? providerAlbumToAlbum(physical) : null;
      const sourceIds: VinylSearchMatch['sourceIds'] = {};
      for (const candidate of sorted) sourceIds[candidate.provider] = [...(sourceIds[candidate.provider] ?? []), candidate.providerId];
      return {
        album,
        vinylRelease,
        vinylReleaseFound: Boolean(vinylRelease),
        matchConfidence: sorted[0].matchConfidence,
        sources: [...new Set(sorted.map(candidate => candidate.provider))],
        sourceIds,
        message: vinylRelease ? undefined : '已识别该专辑，但暂无明确黑胶发行版本资料',
        alternatives,
      };
    }).sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  private priorityOf(providerId: ProviderAlbum['provider']) {
    return this.providers.find(provider => provider.id === providerId)?.priority ?? 99;
  }
}
