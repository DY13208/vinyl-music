import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

export class MusicProviderRegistry {
  public constructor(private readonly providers: MusicProvider[]) {}
  public get(providerId: TrackSource['provider']): MusicProvider | undefined { return this.providers.find(provider => provider.id === providerId); }

  public async search(track: MusicTrack): Promise<TrackSource[]> {
    const results = await Promise.allSettled(this.providers.map(provider => provider.searchTrack(track)));
    return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  }
}
