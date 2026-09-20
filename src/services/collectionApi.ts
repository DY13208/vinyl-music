import type { Album } from '../types';

export class CatalogueError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new CatalogueError((body as { error?: string }).error || `请求失败 (${response.status})`, response.status);
  return body as T;
}

export interface BarcodeLookupResult {
  barcode: string;
  source: 'local' | 'apple-music' | 'chinese-music' | 'netease-music' | 'kugou-music' | 'tencent-music' | 'migu-music' | 'discogs' | 'musicbrainz' | 'deezer';
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

export async function searchVinyl(query: { query?: string; barcode?: string; catalogNumber?: string; artist?: string; album?: string; year?: number }, signal?: AbortSignal): Promise<VinylSearchResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return readJson<VinylSearchResponse>(await fetch(`/api/releases/search?${params.toString()}`, { signal }));
}

export async function getPublicAlbum(provider: string, id: string, signal?: AbortSignal): Promise<Album> {
  const params = new URLSearchParams({ provider, id });
  const result = await readJson<{ album: Album }>(await fetch(`/api/releases/detail?${params}`, { signal }));
  return result.album;
}
