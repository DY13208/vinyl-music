import type { MusicProvider } from './MusicProvider';
import type { MusicTrack, TrackSource } from '../types';

interface AudiusTrack { id: string; title: string; duration?: number; isrc?: string; user?: { name?: string }; artwork?: { '480x480'?: string; '150x150'?: string }; album_backlink?: { playlist_name?: string }; }
const API = 'https://api.audius.co/v1';
const APP_NAME = 'vinyl_music';

export class AudiusProvider implements MusicProvider {
  public readonly id = 'audius' as const;

  public async searchTrack(track: MusicTrack): Promise<TrackSource[]> {
    const query = encodeURIComponent(`${track.title} ${track.artist}`);
    const response = await fetch(`${API}/tracks/search?query=${query}&app_name=${APP_NAME}`);
    if (!response.ok) throw new Error(`Audius Search ${response.status}`);
    const payload = await response.json() as { data?: AudiusTrack[] };
    return (payload.data ?? []).slice(0, 25).map(item => this.toSource(item));
  }

  public async getTrack(providerTrackId: string): Promise<TrackSource | null> {
    const response = await fetch(`${API}/tracks/${encodeURIComponent(providerTrackId)}?app_name=${APP_NAME}`);
    if (!response.ok) return null;
    const payload = await response.json() as { data?: AudiusTrack };
    return payload.data ? this.toSource(payload.data) : null;
  }

  public async resolvePlaybackSource(source: TrackSource): Promise<TrackSource | null> { return source.uri ? source : null; }

  private toSource(item: AudiusTrack): TrackSource {
    return {
      provider: this.id, providerTrackId: item.id,
      uri: `${API}/tracks/${encodeURIComponent(item.id)}/stream?app_name=${APP_NAME}`,
      previewOnly: false, verified: false, matchScore: 0, duration: item.duration,
      metadata: { title: item.title, artist: item.user?.name, album: item.album_backlink?.playlist_name, duration: item.duration, isrc: item.isrc, artwork: item.artwork?.['480x480'] ?? item.artwork?.['150x150'] },
      createdAt: new Date().toISOString(),
    };
  }
}
