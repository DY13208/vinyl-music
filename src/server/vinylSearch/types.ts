import type { Album, Track, VinylRecord } from '../../types.js';

export type VinylProviderId =
  | 'local'
  | 'apple-music'
  | 'chinese-music'
  | 'discogs'
  | 'musicbrainz'
  | 'deezer';

export type ProviderRole = 'local' | 'identity' | 'physical';

export interface VinylSearchQuery {
  query: string;
  barcode?: string;
  catalogNumber?: string;
  artist?: string;
  album?: string;
  year?: number;
}

export interface ProviderAlbum {
  provider: VinylProviderId;
  providerId: string;
  role: ProviderRole;
  title: string;
  artist: string;
  releaseDate?: string;
  year?: number;
  coverUrl?: string;
  genres?: string[];
  label?: string;
  barcode?: string;
  catalogNumber?: string;
  country?: string;
  formats?: string[];
  rpm?: string;
  lpCount?: number;
  edition?: string;
  matrixCode?: string;
  tracks?: Track[];
  discs?: VinylRecord[];
  isVinylRelease?: boolean;
  rawScore?: number;
}

export interface ProviderAvailability {
  available: boolean;
  reason?: string;
  requires?: string[];
}

export interface ProviderSearchStatus extends ProviderAvailability {
  provider: VinylProviderId;
  attempted: boolean;
  hitCount: number;
  durationMs: number;
  httpStatus?: number;
  errorCode?: string;
  error?: string;
  details?: Record<string, ProviderPlatformStatus>;
}

export interface ProviderPlatformStatus {
  attempted: boolean;
  hitCount: number;
  durationMs: number;
  coverCount?: number;
  chineseTitleCount?: number;
  httpStatus?: number;
  errorCode?: string;
  error?: string;
}

export interface VinylSearchProvider {
  readonly id: VinylProviderId;
  readonly role: ProviderRole;
  readonly priority: number;
  availability(): ProviderAvailability;
  search(query: string): Promise<ProviderAlbum[]>;
  searchByBarcode(barcode: string): Promise<ProviderAlbum[]>;
  getAlbum(id: string): Promise<ProviderAlbum | null>;
  getLastSearchStats?(): Record<string, ProviderPlatformStatus>;
}

export interface VinylSearchMatch {
  album: Album;
  vinylRelease: Album | null;
  vinylReleaseFound: boolean;
  matchConfidence: number;
  sources: VinylProviderId[];
  sourceIds: Partial<Record<VinylProviderId, string[]>>;
  message?: string;
  alternatives: Album[];
}

export interface VinylSearchResponse {
  query: VinylSearchQuery;
  results: VinylSearchMatch[];
  providers: ProviderSearchStatus[];
  cached: boolean;
  mergedAlbumCount?: number;
}
