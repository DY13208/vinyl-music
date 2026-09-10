import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

interface ItunesTrack { trackId: number; trackName: string; artistName: string; collectionName: string; previewUrl?: string; trackViewUrl?: string; trackTimeMillis?: number; trackNumber?: number; artworkUrl100?: string; }

export class AppleMusicProvider implements MusicProvider {
  public readonly id = 'apple-music' as const;

  public async searchTrack(track: MusicTrack): Promise<TrackSource[]> {
    const term = encodeURIComponent(`${track.title} ${track.artist}`);
    const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&country=US&limit=25`);
    if (!response.ok) throw new Error(`iTunes Search ${response.status}`);
    const payload = await response.json() as { results?: ItunesTrack[] };
    return (payload.results ?? []).filter(item => item.previewUrl).map(item => this.toSource(item));
  }

  public async getTrack(providerTrackId: string): Promise<TrackSource | null> {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(providerTrackId)}&entity=song`);
    if (!response.ok) return null;
    const payload = await response.json() as { results?: ItunesTrack[] };
    const item = payload.results?.find(result => result.previewUrl);
    return item ? this.toSource(item) : null;
  }

  public async resolvePlaybackSource(source: TrackSource): Promise<TrackSource | null> { return source.uri ? source : null; }

  private toSource(item: ItunesTrack): TrackSource {
    return {
      provider: this.id, providerTrackId: String(item.trackId), uri: item.previewUrl!, previewOnly: true,
      verified: false, matchScore: 0, duration: item.trackTimeMillis ? item.trackTimeMillis / 1000 : undefined,
      metadata: { title: item.trackName, artist: item.artistName, album: item.collectionName, duration: item.trackTimeMillis ? item.trackTimeMillis / 1000 : undefined, trackNumber: item.trackNumber, artwork: item.artworkUrl100, storeUrl: item.trackViewUrl },
      createdAt: new Date().toISOString(),
    };
  }
}
