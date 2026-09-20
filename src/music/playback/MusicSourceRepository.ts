import type { StorageService } from '../../platform/storage/StorageService';
import type { TrackSource } from '../types';

const STORAGE_KEY = 'vinyl_music_track_sources_v1';
interface StoredState { sources: Record<string, TrackSource[]>; preferred: Record<string, string>; rejected: Record<string, string[]>; }
const emptyState = (): StoredState => ({ sources: {}, preferred: {}, rejected: {} });
const identity = (source: Pick<TrackSource, 'provider' | 'providerTrackId'>) => `${source.provider}:${source.providerTrackId}`;

export class MusicSourceRepository {
  public constructor(private readonly storage: StorageService) {}

  public getSources(trackId: string): TrackSource[] { return this.read().sources[trackId] ?? []; }
  public getPreferredIdentity(trackId: string): string | undefined { return this.read().preferred[trackId]; }
  public isRejected(trackId: string, source: Pick<TrackSource, 'provider' | 'providerTrackId'>): boolean { return (this.read().rejected[trackId] ?? []).includes(identity(source)); }

  public bind(trackId: string, source: TrackSource, preferred = false): void {
    const state = this.read(); const sourceId = identity(source);
    state.sources[trackId] = [...(state.sources[trackId] ?? []).filter(item => identity(item) !== sourceId).map(item => preferred ? { ...item, preferred: false } : item), { ...source, preferred, rejected: false }];
    if (preferred) state.preferred[trackId] = sourceId;
    state.rejected[trackId] = (state.rejected[trackId] ?? []).filter(item => item !== sourceId);
    this.write(state);
  }

  public reject(trackId: string, source: Pick<TrackSource, 'provider' | 'providerTrackId'>): void {
    const state = this.read(); const sourceId = identity(source);
    state.rejected[trackId] = [...new Set([...(state.rejected[trackId] ?? []), sourceId])];
    state.sources[trackId] = (state.sources[trackId] ?? []).map(item => identity(item) === sourceId ? { ...item, preferred: false, rejected: true } : item);
    if (state.preferred[trackId] === sourceId) delete state.preferred[trackId];
    this.write(state);
  }

  private read(): StoredState {
    try { const value = this.storage.getItem(STORAGE_KEY); return value ? { ...emptyState(), ...JSON.parse(value) } : emptyState(); }
    catch { return emptyState(); }
  }
  private write(state: StoredState): void { this.storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
}
