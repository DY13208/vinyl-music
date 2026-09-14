import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

export class MusicProviderRegistry {
  public constructor(private readonly providers: MusicProvider[]) {}
  public get(providerId: TrackSource['provider']): MusicProvider | undefined { return this.providers.find(provider => provider.id === providerId); }

  public async search(track: MusicTrack): Promise<TrackSource[]> {
    const results = await Promise.allSettled(this.providers.map(provider => Promise.race([
      provider.searchTrack(track),
      new Promise<TrackSource[]>((_, reject) => setTimeout(() => reject(new Error('音源查询超时')), 8000)),
    ])));
    return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  }
}
