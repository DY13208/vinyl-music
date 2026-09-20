import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

interface ItunesTrack { trackId: number; trackName: string; artistName: string; collectionName: string; previewUrl?: string; trackViewUrl?: string; trackTimeMillis?: number; trackNumber?: number; artworkUrl100?: string; }

export class AppleMusicProvider implements MusicProvider {
  public readonly id = 'apple-music' as const;

  public async searchTrack(track: MusicTrack): Promise<TrackSource[]> {
    // Album translations can exclude the correct recording from Search entirely.
    // Retrieve by song/artist, then validate album and version in TrackMatcher.
    const term = encodeURIComponent(`${track.title} ${track.artist}`);
    const countries = ['HK', 'TW', 'JP', 'KR', 'US', 'CA'];
    const results = await Promise.allSettled(countries.map(async country => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&country=${country}&limit=25`, { signal: controller.signal });
        if (!response.ok) throw new Error(`iTunes ${country} Search ${response.status}`);
        const payload = await response.json() as { results?: ItunesTrack[] };
        return (payload.results ?? []).filter(item => item.previewUrl).map(item => this.toSource(item));
      } finally { clearTimeout(timer); }
    }));
    if (results.every(result => result.status === 'rejected')) {
      throw new Error('Apple Music 搜索失败或超时');
    }
    const sources = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    // Preserve regional names until matching; the same recording may be listed
    // with a Chinese title in Hong Kong and an English title in North America.
    return [...new Map(sources.map(source => [JSON.stringify([source.providerTrackId, source.metadata]), source])).values()];
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
