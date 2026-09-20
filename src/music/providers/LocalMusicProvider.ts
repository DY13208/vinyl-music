import type { LocalAudioSelection } from '../../platform/files/types';
import type { LocalAudioStore } from '../../platform/files/LocalAudioStore';
import type { MusicSourceRepository } from '../playback/MusicSourceRepository';
import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

export class LocalMusicProvider implements MusicProvider {
  public readonly id = 'local' as const;
  public constructor(private readonly repository: MusicSourceRepository, private readonly audioStore: LocalAudioStore) {}

  public async searchTrack(track: MusicTrack): Promise<TrackSource[]> {
    return this.repository.getSources(track.id).filter(source => source.provider === this.id);
  }
  public async getTrack(providerTrackId: string): Promise<TrackSource | null> {
    const uri = await this.audioStore.getPlaybackUri(providerTrackId);
    return uri ? { provider: this.id, providerTrackId, uri, previewOnly: false, verified: true, verificationMethod: 'user', matchScore: 100, metadata: {}, createdAt: new Date().toISOString() } : null;
  }
  public async resolvePlaybackSource(source: TrackSource): Promise<TrackSource | null> {
    const uri = await this.audioStore.getPlaybackUri(source.providerTrackId);
    return uri ? { ...source, uri } : null;
  }
  public async bindUserFile(track: MusicTrack, file: LocalAudioSelection): Promise<TrackSource> {
    const id = `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.audioStore.put(id, file.blob);
    const source: TrackSource = {
      provider: this.id, providerTrackId: id, uri: `local://${id}`, previewOnly: false,
      verified: true, verificationMethod: 'user', matchScore: 100, duration: file.duration,
      metadata: { title: file.title, artist: file.artist, album: track.album, duration: file.duration, filename: file.filename },
      createdAt: new Date().toISOString(),
    };
    this.repository.bind(track.id, source, true);
    return (await this.resolvePlaybackSource(source)) ?? source;
  }
}
