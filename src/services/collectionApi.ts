import type { Album } from '../types';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error || `请求失败 (${response.status})`);
  return body as T;
}

/** @deprecated User collections are local-first. Retained only for legacy/local tooling. */
export async function loadServerCollection() {
  return readJson<Album[]>(await fetch('/api/collection'));
}

/** @deprecated User collections are local-first. Retained only for legacy/local tooling. */
export async function saveAlbumToServer(album: Album) {
  return readJson<Album>(await fetch('/api/collection', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(album) }));
}

/** @deprecated User collections are local-first. Retained only for legacy/local tooling. */
export async function saveAlbumsToServer(albums: Album[]) {
  return readJson<Album[]>(await fetch('/api/collection/import', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ albums }) }));
}

/** @deprecated User collections are local-first. Retained only for legacy/local tooling. */
export async function removeAlbumFromServer(albumId: string) {
  await readJson(await fetch(`/api/collection/${encodeURIComponent(albumId)}`, { method: 'DELETE' }));
}

export interface BarcodeLookupResult {
  barcode: string;
  source: 'local' | 'apple-music' | 'netease-music' | 'kugou-music' | 'tencent-music' | 'migu-music' | 'discogs' | 'musicbrainz' | 'deezer';
  matches: Album[];
  album?: Album;
  vinylRelease?: Album | null;
  vinylReleaseFound?: boolean;
  matchConfidence?: number;
  message?: string;
}

export interface VinylSearchResponse extends BarcodeLookupResult {
  query: { query: string; barcode?: string; catalogNumber?: string; artist?: string; album?: string; year?: number };
  results: Array<{
    album: Album;
    vinylRelease: Album | null;
    vinylReleaseFound: boolean;
    matchConfidence: number;
    sources: BarcodeLookupResult['source'][];
    sourceIds: Partial<Record<BarcodeLookupResult['source'], string[]>>;
    message?: string;
    alternatives: Album[];
  }>;
  providers: Array<{ provider: string; available: boolean; attempted: boolean; hitCount: number; durationMs: number; httpStatus?: number; errorCode?: string; error?: string }>;
  cached: boolean;
}

export async function lookupVinylBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const normalized = barcode.trim().replace(/[\s-]+/g, '');
  return readJson<BarcodeLookupResult>(await fetch(`/api/releases/barcode/${encodeURIComponent(normalized)}`));
}

export async function searchVinyl(query: { query?: string; barcode?: string; catalogNumber?: string; artist?: string; album?: string; year?: number }): Promise<VinylSearchResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return readJson<VinylSearchResponse>(await fetch(`/api/releases/search?${params.toString()}`));
}
