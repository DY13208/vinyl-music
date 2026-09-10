import type { MusicTrack, TrackSource } from '../types';

export interface MusicProvider {
  readonly id: TrackSource['provider'];
  searchTrack(track: MusicTrack): Promise<TrackSource[]>;
  getTrack(providerTrackId: string): Promise<TrackSource | null>;
  resolvePlaybackSource(source: TrackSource): Promise<TrackSource | null>;
}
