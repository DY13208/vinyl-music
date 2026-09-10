export type MusicProviderId = 'apple-music' | 'audius' | 'local' | 'jamendo';
export type VerificationMethod = 'isrc' | 'automatic' | 'user';
export type SourceStatus = 'MATCHED' | 'POSSIBLE_MATCH' | 'NO_SOURCE' | 'NO_RELIABLE_SOURCE' | 'LOCAL_SOURCE_MISSING' | 'SOURCE_UNAVAILABLE' | 'SOURCE_REJECTED';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration?: number;
  isrc?: string;
  trackNumber?: number;
  discNumber?: number;
  artwork?: string;
}

export interface TrackSource {
  provider: MusicProviderId;
  providerTrackId: string;
  uri: string;
  previewOnly: boolean;
  verified: boolean;
  verificationMethod?: VerificationMethod;
  preferred?: boolean;
  rejected?: boolean;
  matchScore: number;
  duration?: number;
  metadata: Partial<MusicTrack> & { storeUrl?: string; filename?: string };
  createdAt: string;
}

export interface SourceResolution {
  status: SourceStatus;
  source?: TrackSource;
  candidates: TrackSource[];
}
