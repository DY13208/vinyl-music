import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

export class MusicProviderRegistry {
  public constructor(private readonly providers: MusicProvider[]) {}
  public get(providerId: TrackSource['provider']): MusicProvider | undefined { return this.providers.find(provider => provider.id === providerId); }

  public async search(track: MusicTrack): Promise<TrackSource[]> {
    const results = await Promise.allSettled(this.providers.map(async provider => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          provider.searchTrack(track),
          new Promise<TrackSource[]>((_, reject) => { timer = setTimeout(() => reject(new Error(`${provider.id} 音源查询超时`)), 8000); }),
        ]);
      } catch (error) {
        console.warn(`[Playback] ${provider.id} 搜索失败`, error);
        throw error;
      } finally { clearTimeout(timer); }
    }));
    return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  }
}
